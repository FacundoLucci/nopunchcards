// Using Web Crypto API (available in V8 runtime) instead of Node crypto
export async function verifyPlaidWebhook(
  bodyText: string,
  signatureHeader: string,
  keyId: string
): Promise<boolean> {
  try {
    // The Plaid-Verification header is a JWS (header.payload.signature)
    const parts = signatureHeader.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWS format");
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // 1. Fetch Plaid's public key from their API
    const plaidEnv = process.env.PLAID_ENV!;
    const basePath =
      plaidEnv === "sandbox"
        ? "https://sandbox.plaid.com"
        : plaidEnv === "development"
        ? "https://development.plaid.com"
        : "https://production.plaid.com";

    const keyResponse = await fetch(
      `${basePath}/webhook_verification_key/get`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
          "PLAID-SECRET": process.env.PLAID_SECRET!,
        },
        body: JSON.stringify({ key_id: keyId }),
      }
    );

    if (!keyResponse.ok) {
      console.error("Failed to fetch Plaid verification key");
      return false;
    }

    const keyData = await keyResponse.json();

    if (!keyData.key) {
      console.error("Invalid key data structure from Plaid");
      return false;
    }

    // Plaid returns a JWK (JSON Web Key), not PEM
    const jwk = keyData.key;

    // 3. Import Key (ES256 uses P-256 curve)
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"]
    );

    // 4. Verify Signature
    // The secured input is "header.payload" (ASCII/UTF-8 bytes)
    // The signature is base64url encoded

    // Convert signature from base64url to ArrayBuffer
    // Replace base64url chars with base64 chars
    const base64Signature = signatureB64.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    const pad = base64Signature.length % 4;
    const paddedSignature = pad
      ? base64Signature + "=".repeat(4 - pad)
      : base64Signature;

    const signatureBytes = Uint8Array.from(atob(paddedSignature), (c) =>
      c.charCodeAt(0)
    );

    const encoder = new TextEncoder();
    const securedInput = `${headerB64}.${payloadB64}`;
    const dataBytes = encoder.encode(securedInput);

    const isValidSignature = await crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signatureBytes,
      dataBytes
    );

    if (!isValidSignature) {
      console.error("JWS signature verification failed");
      return false;
    }

    // 5. Validate Body Hash
    // Decode payload to get request_body_sha256
    const payload = JSON.parse(atob(payloadB64));

    // Calculate SHA-256 of the request body
    const bodyHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(bodyText)
    );
    const bodyHashArray = Array.from(new Uint8Array(bodyHashBuffer));
    const bodyHashHex = bodyHashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (bodyHashHex !== payload.request_body_sha256) {
      console.error("Body hash mismatch", {
        expected: payload.request_body_sha256,
        actual: bodyHashHex,
      });
      return false;
    }

    // 6. Check timestamp (prevent replay attacks) - usually 5 minute window
    const now = Math.floor(Date.now() / 1000);
    if (now - payload.iat > 300) {
      console.error("Webhook timestamp too old");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}

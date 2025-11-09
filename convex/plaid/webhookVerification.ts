// Using Web Crypto API (available in V8 runtime) instead of Node crypto
export async function verifyPlaidWebhook(
  bodyText: string,
  signatureHeader: string,
  keyId: string
): Promise<boolean> {
  try {
    // 1. Extract signature from header (v1= part)
    const signatureMatch = signatureHeader.match(/v1=([^,]+)/);
    if (!signatureMatch) {
      throw new Error("Invalid signature header format");
    }
    const signatureBase64 = signatureMatch[1];

    // 2. Fetch Plaid's public key from their API
    const plaidEnv = process.env.PLAID_ENV!;
    const basePath =
      plaidEnv === "sandbox"
        ? "https://sandbox.plaid.com"
        : plaidEnv === "development"
        ? "https://development.plaid.com"
        : "https://production.plaid.com";

    const keyResponse = await fetch(`${basePath}/webhook_verification_key/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID!,
        "PLAID-SECRET": process.env.PLAID_SECRET!,
      },
      body: JSON.stringify({ key_id: keyId }),
    });

    if (!keyResponse.ok) {
      console.error("Failed to fetch Plaid verification key");
      return false;
    }

    const keyData = await keyResponse.json();
    const pemKey = keyData.key.key;

    // 3. Convert PEM public key to CryptoKey using Web Crypto API
    // Remove PEM headers and decode base64
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pemKey
      .replace(pemHeader, "")
      .replace(pemFooter, "")
      .replace(/\s/g, "");

    // Base64 decode
    const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

    // Import as RSASSA-PKCS1-v1_5 key with SHA-256
    const publicKey = await crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );

    // 4. Convert signature from base64 to ArrayBuffer
    const signatureBytes = Uint8Array.from(atob(signatureBase64), (c) =>
      c.charCodeAt(0)
    );

    // 5. Convert body text to ArrayBuffer
    const encoder = new TextEncoder();
    const bodyBytes = encoder.encode(bodyText);

    // 6. Verify signature using Web Crypto API
    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signatureBytes,
      bodyBytes
    );

    return isValid;
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}


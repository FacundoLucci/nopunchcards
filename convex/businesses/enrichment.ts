"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { authComponent } from "../auth";

type SuggestionSource = "firecrawl" | "google_places" | "heuristic";

const suggestionValidator = v.object({
  value: v.string(),
  source: v.string(),
  confidence: v.optional(v.number()),
  detail: v.optional(v.string()),
});

const colorPaletteValidator = v.object({
  primary: v.string(),
  secondary: v.optional(v.string()),
  accent: v.optional(v.string()),
});

const logoCandidateValidator = v.object({
  url: v.string(),
  source: v.string(),
  detail: v.optional(v.string()),
});

const locationValidator = v.object({
  lat: v.number(),
  lng: v.number(),
});

const googlePlaceValidator = v.object({
  placeId: v.string(),
  name: v.optional(v.string()),
  formattedAddress: v.optional(v.string()),
  rating: v.optional(v.number()),
  userRatingsTotal: v.optional(v.number()),
  website: v.optional(v.string()),
  types: v.optional(v.array(v.string())),
  phoneNumber: v.optional(v.string()),
  photoUrl: v.optional(v.string()),
  location: v.optional(locationValidator),
});

export const enrichFromWebsite = action({
  args: {
    websiteUrl: v.string(),
  },
  returns: v.object({
    normalizedUrl: v.string(),
    fetchedAt: v.number(),
    summary: v.optional(v.string()),
    warnings: v.optional(v.array(v.string())),
    suggestions: v.object({
      names: v.optional(v.array(suggestionValidator)),
      categories: v.optional(v.array(suggestionValidator)),
      addresses: v.optional(v.array(suggestionValidator)),
      descriptions: v.optional(v.array(suggestionValidator)),
    }),
    branding: v.object({
      colors: v.optional(colorPaletteValidator),
      logoCandidates: v.optional(v.array(logoCandidateValidator)),
    }),
    googlePlace: v.optional(googlePlaceValidator),
  }),
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const normalizedUrl = normalizeWebsite(args.websiteUrl);
    const warnings: string[] = [];

    const [firecrawlPayload, googlePlace] = await Promise.all([
      fetchFirecrawlData(normalizedUrl).catch((error) => {
        console.error("[firecrawl] scrape failed", error);
        warnings.push("Firecrawl enrichment failed. You can continue manually.");
        return null;
      }),
      fetchGooglePlaceData(normalizedUrl).catch((error) => {
        console.error("[google-places] lookup failed", error);
        warnings.push("Google Places lookup failed. You can continue manually.");
        return null;
      }),
    ]);

    const nameSuggestions = dedupeSuggestions([
      buildSuggestion(firecrawlPayload?.metadata?.title, "firecrawl", 0.9, "Website title"),
      buildSuggestion(firecrawlPayload?.metadata?.openGraph?.title, "firecrawl", 0.85, "OpenGraph title"),
      buildSuggestion(googlePlace?.name, "google_places", googlePlace?.rating ? Math.min(1, googlePlace.rating / 5) : 0.8, "Google Business Profile"),
      buildSuggestion(guessNameFromUrl(normalizedUrl), "heuristic", 0.5, "Inferred from domain"),
    ]);

    const categorySuggestions = dedupeSuggestions([
      ...mapGoogleTypesToCategories(googlePlace?.types ?? []),
    ]);

    const addressSuggestions = dedupeSuggestions([
      buildSuggestion(googlePlace?.formattedAddress, "google_places", 0.9, "Google formatted address"),
    ]);

    const descriptionSuggestions = dedupeSuggestions([
      buildSuggestion(firecrawlPayload?.metadata?.description, "firecrawl", 0.75, "Meta description"),
      buildSuggestion(extractSummary(firecrawlPayload?.markdown), "firecrawl", 0.65, "First paragraph on site"),
    ]);

    const colors = extractColorPalette(firecrawlPayload);
    const logoCandidates = collectLogoCandidates(firecrawlPayload, googlePlace, normalizedUrl);

    return {
      normalizedUrl,
      fetchedAt: Date.now(),
      summary:
        firecrawlPayload?.metadata?.description ??
        extractSummary(firecrawlPayload?.markdown) ??
        googlePlace?.formattedAddress,
      warnings: warnings.length ? warnings : undefined,
      suggestions: {
        names: nameSuggestions.length ? nameSuggestions : undefined,
        categories: categorySuggestions.length ? categorySuggestions : undefined,
        addresses: addressSuggestions.length ? addressSuggestions : undefined,
        descriptions: descriptionSuggestions.length ? descriptionSuggestions : undefined,
      },
      branding: {
        colors: colors ?? undefined,
        logoCandidates: logoCandidates.length ? logoCandidates : undefined,
      },
      googlePlace: googlePlace ?? undefined,
    };
  },
});

type FirecrawlData = {
  markdown?: string;
  metadata?: {
    title?: string;
    description?: string;
    themeColor?: string;
    openGraph?: Record<string, any>;
    twitter?: Record<string, any>;
    icons?: Array<{ src?: string }>;
    favicons?: Array<{ src?: string }>;
  };
};

type GooglePlaceDetails = {
  placeId: string;
  name?: string;
  formattedAddress?: string;
  rating?: number;
  userRatingsTotal?: number;
  website?: string;
  types?: string[];
  phoneNumber?: string;
  photoUrl?: string;
  location?: { lat: number; lng: number };
};

async function fetchFirecrawlData(url: string): Promise<FirecrawlData | null> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured");
  }

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "metadata"],
      onlyMainContent: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firecrawl error: ${response.status} ${text}`);
  }

  return (await response.json()) as FirecrawlData;
}

async function fetchGooglePlaceData(url: string): Promise<GooglePlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY is not configured");
  }

    const domainName = new URL(url).hostname.replace(/^www\./, "");

    const findResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        domainName
      )}&inputtype=textquery&fields=place_id,name,formatted_address,types&key=${apiKey}`,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!findResponse.ok) {
      const text = await findResponse.text();
      throw new Error(`Google Places find error: ${findResponse.status} ${text}`);
    }
    const findJson = await findResponse.json();

  const candidate = findJson.candidates?.[0];
  if (!candidate?.place_id) {
    return null;
  }

    const detailsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${
        candidate.place_id
      }&fields=name,formatted_address,website,international_phone_number,rating,user_ratings_total,types,geometry,photos&key=${apiKey}`,
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!detailsResponse.ok) {
      const text = await detailsResponse.text();
      throw new Error(`Google Places details error: ${detailsResponse.status} ${text}`);
    }
    const detailsJson = await detailsResponse.json();
  const details = detailsJson.result;
  if (!details) {
    return null;
  }

  const photoReference = details.photos?.[0]?.photo_reference;
  const photoUrl = photoReference
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${apiKey}`
    : undefined;

  return {
    placeId: candidate.place_id,
    name: details.name,
    formattedAddress: details.formatted_address,
    rating: details.rating,
    userRatingsTotal: details.user_ratings_total,
    website: details.website,
    types: details.types,
    phoneNumber: details.international_phone_number,
    photoUrl,
    location: details.geometry?.location
      ? {
          lat: details.geometry.location.lat,
          lng: details.geometry.location.lng,
        }
      : undefined,
  };
}

function normalizeWebsite(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Website URL is required");
  }
  const prefixed = /^(https?):\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(prefixed);
  } catch {
    throw new Error("Invalid website URL");
  }
  url.hash = "";
  if (!url.pathname || url.pathname === "/") {
    url.pathname = "";
  }
  const normalized = url.toString();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function buildSuggestion(
  value: string | undefined | null,
  source: SuggestionSource,
  confidence?: number,
  detail?: string
) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return {
    value: trimmed,
    source,
    confidence,
    detail,
  };
}

function dedupeSuggestions(
  suggestions: Array<ReturnType<typeof buildSuggestion>>
): Array<Exclude<ReturnType<typeof buildSuggestion>, null>> {
  const seen = new Set<string>();
  const result: Array<Exclude<ReturnType<typeof buildSuggestion>, null>> = [];

  suggestions.forEach((suggestion) => {
    if (!suggestion) return;
    const key = suggestion.value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(suggestion);
  });

  return result;
}

function guessNameFromUrl(url: string) {
  const host = new URL(url).hostname.replace(/^www\./, "");
  const parts = host.split(".");
  if (!parts.length) return null;
  return parts[0].replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractSummary(markdown?: string | null) {
  if (!markdown) return null;
  const paragraphs = markdown
    .split(/\n\s*\n/)
    .map((section) => section.replace(/[#>*_`]/g, "").trim())
    .filter(Boolean);
  if (!paragraphs.length) return null;
  return paragraphs[0].slice(0, 280);
}

function extractColorPalette(payload: FirecrawlData | null): { primary: string; secondary?: string; accent?: string } | null {
  if (!payload) return null;
  const candidates: string[] = [];

  const metaColors = [
    payload.metadata?.themeColor,
    payload.metadata?.openGraph?.themeColor,
    payload.metadata?.twitter?.cardColor,
  ];

  metaColors.forEach((color) => {
    if (color) {
      candidates.push(color);
    }
  });

  if (candidates.length < 2 && payload.markdown) {
    const hexMatches = payload.markdown.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/g);
    if (hexMatches) {
      candidates.push(...hexMatches);
    }
  }

  const unique = candidates
    .map((color) => normalizeColor(color))
    .filter((color): color is string => Boolean(color));

  if (!unique.length) return null;

  return {
    primary: unique[0],
    secondary: unique[1],
    accent: unique[2],
  };
}

function normalizeColor(color?: string | null) {
  if (!color) return null;
  const hexMatch = color.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/);
  if (hexMatch) return hexMatch[0];
  return null;
}

function collectLogoCandidates(
  payload: FirecrawlData | null,
  googlePlace: GooglePlaceDetails | null,
  baseUrl: string
) {
  const urls = new Set<string>();
  const candidates: Array<{ url: string; source: string; detail?: string }> = [];

  const add = (value?: string | null, source?: string, detail?: string) => {
    if (!value) return;
    const normalized = resolveToAbsolute(value.trim(), baseUrl);
    if (!normalized || urls.has(normalized)) return;
    urls.add(normalized);
    candidates.push({ url: normalized, source: source ?? "firecrawl", detail });
  };

  payload?.metadata?.openGraph?.image && add(payload.metadata.openGraph.image, "firecrawl", "OpenGraph image");
  payload?.metadata?.twitter?.image && add(payload.metadata.twitter.image, "firecrawl", "Twitter card image");

  payload?.metadata?.icons?.forEach((icon) => add(icon.src, "firecrawl", "Site icon"));
  payload?.metadata?.favicons?.forEach((icon) => add(icon.src, "firecrawl", "Favicon"));

  add(googlePlace?.photoUrl, "google_places", "Google Places photo");

  return candidates;
}

function resolveToAbsolute(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function mapGoogleTypesToCategories(types: string[]) {
  const categoryMap: Record<string, string> = {
    cafe: "Coffee",
    coffee_shop: "Coffee",
    meal_takeaway: "Restaurant",
    meal_delivery: "Restaurant",
    restaurant: "Restaurant",
    bar: "Restaurant",
    grocery_or_supermarket: "Grocery",
    supermarket: "Grocery",
    bakery: "Retail",
    clothing_store: "Retail",
    store: "Retail",
    gym: "Fitness",
    hair_care: "Salon",
    beauty_salon: "Salon",
    spa: "Salon",
  };

  return types
    .map((type) => {
      const mapped = categoryMap[type];
      if (!mapped) return null;
      return buildSuggestion(mapped, "google_places", 0.8, `Google type: ${type}`);
    })
    .filter((value): value is ReturnType<typeof buildSuggestion> => Boolean(value));
}

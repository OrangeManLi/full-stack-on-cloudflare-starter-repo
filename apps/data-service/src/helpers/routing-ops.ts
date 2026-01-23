import { initDatabase } from "@repo/data-ops/database";
import { getLink } from "@repo/data-ops/queries/links";

// Type for link destinations (geo-routing)
type Destinations = {
  default: string;
  [countryCode: string]: string;
};

// Type for link info from database
export type LinkInfo = {
  linkId: string;
  accountId: string;
  name: string;
  destinations: Destinations;
  createdAt: string | number | null;
  updatedAt: string | number | null;
};

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300;

/**
 * Gets link info from KV cache or falls back to database.
 * Implements cache-aside pattern: check cache first, then database, then populate cache.
 *
 * @param linkId - The link ID to fetch
 * @param cache - KV namespace for caching
 * @param db - D1 database binding
 * @returns Link info or null if not found
 */
export async function getLinkInfoFromKV(
  linkId: string,
  cache: KVNamespace,
  db: D1Database
): Promise<LinkInfo | null> {
  const cacheKey = `link:${linkId}`;

  // Step 1: Check KV cache first
  const cachedData = await cache.get<LinkInfo>(cacheKey, "json");

  if (cachedData) {
    // Cache hit - return cached data
    return cachedData;
  }

  // Step 2: Cache miss - query database
  initDatabase(db);
  const linkInfo = await getLink({ linkId });

  if (!linkInfo) {
    // Link not found in database
    return null;
  }

  // Step 3: Store in KV cache for future requests
  await cache.put(cacheKey, JSON.stringify(linkInfo), {
    expirationTtl: CACHE_TTL,
  });

  return linkInfo as LinkInfo;
}

/**
 * Gets the destination URL for a given country code.
 * If no country code is provided or the country doesn't have a specific destination,
 * returns the default destination.
 *
 * @param linkInfo - The link information from database
 * @param countryCode - Optional ISO country code (e.g., "US", "MY", "JP")
 * @returns The destination URL for the country or the default destination
 */
export function getDestinationForCountry(
  linkInfo: LinkInfo,
  countryCode?: string
): string {
  const { destinations } = linkInfo;

  // If no country code provided, return default destination
  if (!countryCode) {
    return destinations.default;
  }

  // Check if country code exists in destinations
  if (countryCode in destinations) {
    return destinations[countryCode];
  }

  // Fallback to default destination
  return destinations.default;
}

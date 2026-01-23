// Type for link destinations (geo-routing)
type Destinations = {
  default: string;
  [countryCode: string]: string;
};

// Type for link info from database
type LinkInfo = {
  linkId: string;
  accountId: string;
  name: string;
  destinations: Destinations;
  createdAt: string | number | null;
  updatedAt: string | number | null;
};

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

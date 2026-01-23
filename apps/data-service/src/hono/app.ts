import { Hono } from "hono";

// Define types for link destinations (geo-routing)
type Destinations = {
  default: string;
  [countryCode: string]: string;
};

type LinkRow = {
  destinations: string;
};

// Define the Hono app with Cloudflare bindings type
export const app = new Hono<{ Bindings: Env }>();

// Cache TTL in seconds (5 minutes)
const CACHE_TTL = 300;

// Geolocation info route
app.get("/geo", (c) => {
  // Step 1: Create cf constant to simplify code
  const cf = c.req.raw.cf;

  // Step 2: Extract location variables
  const country = cf?.country;
  const lat = cf?.latitude;
  const long = cf?.longitude;

  // Step 3: Return JSON response with location info
  return c.json({
    country,
    lat,
    long,
  });
});

// Dynamic route for link redirection (/:id)
app.get("/:id", async (c) => {
  const id = c.req.param("id");

  // Step 1: Create cf constant to simplify code
  const cf = c.req.raw.cf;

  // Step 2: Extract location variables
  const country = cf?.country as string | undefined;

  // Step 5: Check KV cache first for instant redirect
  const cacheKey = `link:${id}`;
  const cachedData = await c.env.REDIRECT_CACHE.get<Destinations>(cacheKey, "json");

  let destinations: Destinations | null = null;

  if (cachedData) {
    // Cache hit - use cached destinations
    destinations = cachedData;
  } else {
    // Step 6: Cache miss - query database using raw D1
    const result = await c.env.DB.prepare(
      "SELECT destinations FROM links WHERE link_id = ? LIMIT 1"
    )
      .bind(id)
      .first<LinkRow>();

    if (!result) {
      return c.json({ error: "Link not found" }, 404);
    }

    // Parse destinations JSON from database
    destinations = JSON.parse(result.destinations) as Destinations;

    // Store in KV cache for future requests
    await c.env.REDIRECT_CACHE.put(
      cacheKey,
      JSON.stringify(destinations),
      { expirationTtl: CACHE_TTL }
    );
  }

  // Determine redirect URL based on country (geo-routing)
  const redirectUrl = (country && destinations[country]) || destinations.default;

  // Perform instant redirect
  return c.redirect(redirectUrl, 302);
});

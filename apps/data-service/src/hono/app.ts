import { Hono } from "hono";
import { initDatabase } from "@repo/data-ops/database";
import { getLink } from "@repo/data-ops/queries/links";

// Define types for link destinations (geo-routing)
type Destinations = {
  default: string;
  [countryCode: string]: string;
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
  // Task 2: Extract path parameter using c.req.param('id')
  const id = c.req.param("id");

  // Initialize database with D1 binding
  initDatabase(c.env.DB);

  // Task 3: Call getLink from data-ops package
  const linkInfoFromDb = await getLink({ linkId: id });

  // Task 4: Return JSON response for testing (before implementing redirect)
  // This allows us to verify the database connection is working
  return c.json(linkInfoFromDb);
});

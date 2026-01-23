import { Hono } from "hono";
import { cloudflareInfoSchema } from "@repo/data-ops/zod-schema/links";
import {
  getLinkInfoFromKV,
  getDestinationForCountry,
} from "../helpers/routing-ops";

// Define the Hono app with Cloudflare bindings type
export const app = new Hono<{ Bindings: Env }>();

// Geolocation info route (for testing)
app.get("/geo", (c) => {
  const cf = c.req.raw.cf;

  const country = cf?.country;
  const lat = cf?.latitude;
  const long = cf?.longitude;

  return c.json({
    country,
    lat,
    long,
  });
});

// Dynamic route for link redirection (/:id)
app.get("/:id", async (c) => {
  // Get link ID from path parameter
  const id = c.req.param("id");

  // Verify cache binding is available
  if (!c.env.cache) {
    return c.json({ error: "Cache not configured" }, 500);
  }

  // Get link info from KV cache (or database fallback)
  const linkInfo = await getLinkInfoFromKV(id, c.env.cache, c.env.DB);

  // Error handling - return 404 if link not found
  if (!linkInfo) {
    return c.json({ error: "Destination not found" }, 404);
  }

  // Parse Cloudflare headers using safeParse
  const cf = c.req.raw.cf;
  const headers = cloudflareInfoSchema.safeParse(cf);

  // Error handling - return 400 if invalid Cloudflare headers
  if (!headers.success) {
    return c.json({ error: "Invalid Cloudflare headers" }, 400);
  }

  // Get destination URL based on country (geo-routing)
  const destination = getDestinationForCountry(linkInfo, headers.data.country);

  // Redirect to destination URL
  return c.redirect(destination, 302);
});

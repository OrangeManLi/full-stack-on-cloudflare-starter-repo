import { Hono } from "hono";
import { initDatabase } from "@repo/data-ops/database";
import { getLink } from "@repo/data-ops/queries/links";
import { cloudflareInfoSchema } from "@repo/data-ops/zod-schema/links";
import { getDestinationForCountry } from "../helpers/routing-ops";

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
  // Task 6: Get link ID from path parameter
  const id = c.req.param("id");

  // Initialize database with D1 binding
  initDatabase(c.env.DB);

  // Call getLink to get link info from database
  const linkInfo = await getLink({ linkId: id });

  // Task 6: Error handling - return 404 if link not found
  if (!linkInfo) {
    return c.json({ error: "Destination not found" }, 404);
  }

  // Task 7: Parse Cloudflare headers using safeParse
  const cf = c.req.raw.cf;
  const headers = cloudflareInfoSchema.safeParse(cf);

  // Task 7: Error handling - return 400 if invalid Cloudflare headers
  if (!headers.success) {
    return c.json({ error: "Invalid Cloudflare headers" }, 400);
  }

  // Task 8: Get destination URL based on country (geo-routing)
  const destination = getDestinationForCountry(linkInfo, headers.data.country);

  // Task 8: Redirect to destination URL
  return c.redirect(destination, 302);
});

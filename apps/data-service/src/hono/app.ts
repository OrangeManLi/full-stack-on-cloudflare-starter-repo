import { Hono } from "hono";

// Define the Hono app with Cloudflare bindings type
export const app = new Hono<{ Bindings: Env }>();

// Dynamic route for link redirection (/:id)
app.get("/:id", (c) => {
  const id = c.req.param("id");
  const userAgent = c.req.header("User-Agent") || "unknown";

  return c.json({
    id,
    userAgent,
    message: `Received request for link: ${id}`,
  });
});

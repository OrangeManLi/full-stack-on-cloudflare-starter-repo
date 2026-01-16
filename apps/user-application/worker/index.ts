import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Migration endpoint to initialize database
    if (url.pathname === "/api/migrate") {
      try {
        // Drop and recreate table to ensure clean state
        await env.DB.prepare(`DROP TABLE IF EXISTS links`).run();
        await env.DB.prepare(`CREATE TABLE links (link_id TEXT PRIMARY KEY NOT NULL, account_id TEXT NOT NULL, name TEXT NOT NULL, destinations TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`).run();
        return new Response(JSON.stringify({ success: true, message: "Migration completed - table recreated" }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ success: false, error: errorMessage }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Debug endpoint to check table structure
    if (url.pathname === "/api/debug") {
      try {
        const tables = await env.DB.prepare(`SELECT name, sql FROM sqlite_master WHERE type='table'`).all();
        return new Response(JSON.stringify({ success: true, tables: tables.results }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ success: false, error: errorMessage }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname.startsWith("/trpc")) {
      return fetchRequestHandler({
        endpoint: "/trpc",
        req: request,
        router: appRouter,
        createContext: () =>
          createContext({ req: request, env: env, workerCtx: ctx }),
      });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<ServiceBindings>;

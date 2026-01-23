interface Env extends Cloudflare.Env {
  DB: D1Database;
  REDIRECT_CACHE: KVNamespace;
}

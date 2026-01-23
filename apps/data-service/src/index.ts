import { WorkerEntrypoint } from "cloudflare:workers";
import { app } from "./hono/app";

export default class DataService extends WorkerEntrypoint<Env> {
  fetch(request: Request) {
    // Delegate all requests to Hono app
    return app.fetch(request, this.env, this.ctx);
  }
}

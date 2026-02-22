import express from "express";
import cookieParser from "cookie-parser";
import type { Request, Response } from "express";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(cookieParser());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

// Dynamically import and register routes
let routesRegistered = false;
async function ensureRoutes() {
  if (routesRegistered) return;
  const { registerRoutes } = await import("../server/routes");
  await registerRoutes(httpServer, app);
  routesRegistered = true;
}

// Catch-all handler
export default async function handler(req: Request, res: Response) {
  await ensureRoutes();
  app(req, res);
}

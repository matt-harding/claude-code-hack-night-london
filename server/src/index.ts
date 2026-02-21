import "./env.js"; // Load environment variables first
import cors from "cors";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { clerkMiddleware } from "@clerk/express";
import {
  mcpAuthClerk,
  protectedResourceHandlerClerk,
  authServerMetadataHandlerClerk,
} from "@clerk/mcp-tools/express";
import { widgetsDevServer } from "skybridge/server";
import { mcp } from "./middleware.js";
import server from "./server.js";

const app = express();

app.use(express.json({ limit: "50mb" }));

const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv !== "production") {
  const { devtoolsStaticServer } = await import("@skybridge/devtools");
  app.use(await devtoolsStaticServer());
  app.use(await widgetsDevServer());
}

if (nodeEnv === "production") {
  app.use("/assets", cors());
  app.use("/assets", express.static("dist/assets"));
}

app.use(cors());
app.use(clerkMiddleware());

// In development, skip auth for local DevTools testing
// In production (or via tunnel), require OAuth
const isLocalRequest = (req: Request) => {
  const host = req.get("host") || "";
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
};

app.use("/mcp", (req: Request, res: Response, next: NextFunction) => {
  if (nodeEnv !== "production" && isLocalRequest(req)) {
    return next(); // Skip auth for local requests in dev
  }
  return mcpAuthClerk(req, res, next);
});
app.use(mcp(server));

app.get(
  "/.well-known/oauth-protected-resource/mcp",
  protectedResourceHandlerClerk({ scopes_supported: ["email", "profile"] }),
);

app.get(
  "/.well-known/oauth-authorization-server",
  authServerMetadataHandlerClerk,
);

app.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});

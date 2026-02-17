import cors from "cors";
import express from "express";
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

app.use(express.json());

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
app.use("/mcp", mcpAuthClerk);
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

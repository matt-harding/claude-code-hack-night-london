import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

if (process.env.NODE_ENV !== "production") {
  process.loadEnvFile();
}

export const env = createEnv({
  server: {
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEO4J_URI: z.string().optional(),
    NEO4J_USER: z.string().optional(),
    NEO4J_PASSWORD: z.string().optional(),
  },
  runtimeEnv: process.env,
});

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

process.loadEnvFile();

export const env = createEnv({
  server: {
    SUPABASE_URL: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
});

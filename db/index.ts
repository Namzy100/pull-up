import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type D1Binding = Parameters<typeof drizzle>[0];

// The Cloudflare D1 binding (`env.DB`) only exists inside the Cloudflare Workers
// runtime. Statically importing `cloudflare:workers` breaks the native
// Node/Vercel build, so the binding is resolved lazily at call time. When a
// control plane injects the binding it lands on `globalThis.DB`; on Vercel it is
// absent and these legacy D1 routes throw a clear error instead of crashing at
// import time.
function resolveD1Binding(): D1Binding | undefined {
  return (globalThis as { DB?: D1Binding }).DB;
}

export function getDb() {
  const binding = resolveD1Binding();
  if (!binding) {
    throw new Error("Legacy D1 database is unavailable in this runtime.");
  }

  return drizzle(binding, { schema });
}

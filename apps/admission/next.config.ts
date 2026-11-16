import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

/**
 * Static export: no server in production. Shared packages are TypeScript sources, so Next compiles them
 * (`transpilePackages`); `turbopack.root` is the monorepo root so files outside this folder can be imported.
 */
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // `bun run check` type-checks everything including tests; the production build skips test files.
  typescript: { tsconfigPath: "tsconfig.build.json" },
  transpilePackages: [
    "@ihsp/api",
    "@ihsp/auth",
    "@ihsp/config",
    "@ihsp/features-core",
    "@ihsp/i18n",
    "@ihsp/telegram",
    "@ihsp/ui",
  ],
  turbopack: { root: fileURLToPath(new URL("../..", import.meta.url)) },
}

export default config

import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

/**
 * Static export served under `/ai` (nginx serves `/ai/view/index.html` for any `/ai/*` path).
 * Shared packages are TypeScript sources, so Next compiles them (`transpilePackages`);
 * `turbopack.root` is the monorepo root so files outside this folder can be imported.
 */
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: "/ai",
  images: {
    unoptimized: true,
  },
  // Development only: nginx serves `/ai/view/index.html` for every `/ai/<slug>` in production
  // (deploy/sites/share.conf); the dev server does the same here, so the share viewer opens at the URL the backend hands
  // out. A static export rejects rewrites (with a warning), so `next build` does not get the key at all.
  ...(process.env.NODE_ENV === "production"
    ? {}
    : {
        async rewrites() {
          return [{ source: "/:slug((?!view$|env\\.js$)[^/.]+)", destination: "/view/" }]
        },
      }),
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

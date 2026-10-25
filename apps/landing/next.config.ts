import type { NextConfig } from "next"
import { fileURLToPath } from "node:url"

/** Static export of the public landing page (ihsu.uz); no server, no API calls. */
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  typescript: { tsconfigPath: "tsconfig.build.json" },
  transpilePackages: ["@ihsp/config", "@ihsp/i18n", "@ihsp/ui"],
  turbopack: { root: fileURLToPath(new URL("../..", import.meta.url)) },
}

export default config

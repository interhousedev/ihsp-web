import { BRAND } from "@ihsp/config/brand"
import type { MetadataRoute } from "next"

export const dynamic = "force-static"

/** The landing is public: crawlers may read everything and find the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `https://${BRAND.landingHost}/sitemap.xml`,
  }
}

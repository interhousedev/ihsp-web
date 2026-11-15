import { BRAND } from "@ihsp/config/brand"
import type { MetadataRoute } from "next"

export const dynamic = "force-static"

/** The landing is one page (the language is chosen on the client); the library lists its own sitemap. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `https://${BRAND.landingHost}/`, changeFrequency: "monthly", priority: 1 }]
}

import type { MetadataRoute } from "next"

export const dynamic = "force-static"

/** Every page of the LMS needs a sign-in (course pages included), so nothing is offered to crawlers. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } }
}

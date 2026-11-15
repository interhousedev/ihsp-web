import { describe, expect, it } from "bun:test"
import robots, { dynamic as robotsDynamic } from "../robots"
import sitemap, { dynamic as sitemapDynamic } from "../sitemap"
import { ORGANIZATION_JSON_LD } from "../json-ld"

describe("landing indexing files", () => {
  it("robots.txt and sitemap.xml are static and agree on the host", () => {
    expect(robotsDynamic).toBe("force-static")
    expect(sitemapDynamic).toBe("force-static")
    const rules = robots()
    expect(rules.rules).toEqual({ userAgent: "*", allow: "/" })
    expect(rules.sitemap).toBe("https://ihsu.uz/sitemap.xml")
    expect(sitemap().map((entry) => entry.url)).toEqual(["https://ihsu.uz/"])
  })

  it("describes the school as an EducationalOrganization", () => {
    expect(ORGANIZATION_JSON_LD["@type"]).toBe("EducationalOrganization")
  })
})

import { describe, expect, it } from "bun:test"
import robots, { dynamic as robotsDynamic } from "../robots"
import sitemap, { dynamic as sitemapDynamic } from "../sitemap"
import { BRAND } from "@ihsp/config/brand"
import { ORGANIZATION_JSON_LD } from "../json-ld"
import { DESCRIPTION, TITLE } from "../site-meta"

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

  it("LND-1 the title names the app and the school, the description lists what the platform does", () => {
    expect(TITLE).toBe(`${BRAND.apps.sp.name} — ${BRAND.orgAlias}`)
    for (const word of ["timetable", "marks", "homework", "library", "courses"]) {
      expect(DESCRIPTION.toLowerCase()).toContain(word)
    }
    expect(DESCRIPTION).not.toContain("!")
  })

  it("LND-2 the organization data repeats the description and the three languages", () => {
    expect(ORGANIZATION_JSON_LD.description).toBe(DESCRIPTION)
    expect(ORGANIZATION_JSON_LD.knowsLanguage).toEqual(["uz", "ru", "en"])
  })
})

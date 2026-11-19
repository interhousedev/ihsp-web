import { describe, expect, it } from "bun:test"
import { screen } from "@testing-library/react"
import { userMe } from "@ihsp/test-utils"
import { renderAdmissionApp } from "../tests/helpers"
import { activePart } from "../components/section-tabs"
import { SECTION_IDS, SECTIONS, sectionFor, useNav } from "./nav"

function Probe() {
  const { groups, bottom } = useNav()
  return (
    <>
      <p data-testid="bottom">{bottom.map((item) => `${item.title}=${item.url}`).join("|")}</p>
      <p data-testid="items">
        {groups
          .flatMap((group) => group.items)
          .map((item) => item.url)
          .join("|")}
      </p>
    </>
  )
}

describe("sections", () => {
  it("keeps the order of the IA", () => {
    expect(SECTION_IDS).toEqual(["career", "activities", "universities", "essays", "apply"])
  })

  it.each([
    ["/career/", "career"],
    ["/plan/", "activities"],
    ["/opportunities/scholarships/", "activities"],
    ["/opportunities/view/", "activities"],
    ["/tests/", "activities"],
    ["/courses/", "activities"],
    ["/chooser/institution/", "universities"],
    ["/chooser/budget/?view=scholarships", "universities"],
    ["/essays/edit/", "essays"],
    ["/deadlines/", "apply"],
    ["/tasks/", "apply"],
    ["/review/", "apply"],
    ["/outcomes/", "apply"],
    ["/documents/", "apply"],
  ])("puts %s into %s", (path, id) => {
    expect(sectionFor(path)?.id as string | undefined).toBe(id)
  })

  it("belongs to no section on Home, Settings and the staff area", () => {
    for (const path of ["/", "/settings/", "/faq/", "/help/", "/staff/", "/planet/"]) {
      expect(sectionFor(path)).toBeNull()
    }
  })

  it("picks the active part from the route or from ?tab=", () => {
    expect(activePart(SECTIONS.activities, "/opportunities/view/", null)?.id).toBe("ideas")
    expect(activePart(SECTIONS.apply, "/outcomes/", null)?.id).toBe("results")
    expect(activePart(SECTIONS.career, "/career/", "future")?.id).toBe("future")
    expect(activePart(SECTIONS.career, "/career/", null)?.id).toBe("explore")
    expect(activePart(SECTIONS.essays, "/essays/", "alignment")?.id).toBe("alignment")
  })
})

describe("useNav", () => {
  it("gives a student five phone items, one per section", async () => {
    renderAdmissionApp(<Probe />, { session: { user: { ...userMe, roles: ["student"] } } })
    const bottom = (await screen.findByTestId("bottom")).textContent?.split("|")
    expect(bottom).toEqual([
      "Career=/career/",
      "Activities=/activities/",
      "Universities=/chooser/list/",
      "Essays=/essays/",
      "Apply=/documents/",
    ])
  })

  it("gives each student sidebar section the prefixes of its section", () => {
    function Prefixes() {
      const { groups } = useNav()
      return <p data-testid="prefixes">{groups[0]?.items.map((item) => item.matchPrefixes?.join(",")).join("|")}</p>
    }
    renderAdmissionApp(<Prefixes />, { session: { user: { ...userMe, roles: ["student"] } } })
    return screen.findByTestId("prefixes").then((node) => {
      expect(node.textContent).toBe(SECTION_IDS.map((id) => SECTIONS[id].prefixes.join(",")).join("|"))
    })
  })

  it("adds exactly Exemplars and Prompt studio to the staff entries", async () => {
    renderAdmissionApp(<Probe />, { session: { user: { ...userMe, roles: ["counselor"] } } })
    const items = (await screen.findByTestId("items")).textContent?.split("|") ?? []
    expect(items).toContain("/staff/exemplars/")
    expect(items).toContain("/staff/prompt-studio/")
    expect(items.indexOf("/staff/catalog/")).toBeLessThan(items.indexOf("/staff/exemplars/"))
  })
})

/** ADM-1: the sidebar groups and the icons of its items; the groups stay small and the same icon never stands for two pages. */
import { describe, expect, test } from "bun:test"
import { useNav } from "../config/nav"
import { configureTests, renderAdmin } from "./helpers"

configureTests()

type Groups = ReturnType<typeof useNav>["groups"]

/** Hands the rendered sidebar groups to the test through a box the probe fills while it renders. */
function NavProbe({ box }: { box: { groups: Groups } }) {
  box.groups = useNav().groups
  return null
}

function renderNav(): Groups {
  const box: { groups: Groups } = { groups: [] }
  renderAdmin(<NavProbe box={box} />)
  return box.groups
}

function itemsOf(groups: Groups, label: string) {
  return groups.find((group) => group.label === label)?.items ?? []
}

describe("admin sidebar (ADM-1)", () => {
  test("Certificate types sit next to Certificates in Reports", () => {
    const groups = renderNav()

    const titles = itemsOf(groups, "Reports").map((item) => item.title)
    expect(titles.indexOf("Certificate types")).toBe(titles.indexOf("Certificates") + 1)
    expect(itemsOf(groups, "Academics").map((item) => item.title)).not.toContain("Certificate types")
  })

  test("Operations holds Monitoring, Logs and Limits & usage, and Tools no longer has Limits", () => {
    const groups = renderNav()

    expect(itemsOf(groups, "Operations").map((item) => item.url)).toEqual(["/monitoring/", "/logs/", "/limits/"])
    expect(itemsOf(groups, "Reports").map((item) => item.title)).not.toContain("Monitoring")
    expect(itemsOf(groups, "Tools").map((item) => item.url)).not.toContain("/limits/")
  })

  test("Login cues, Bot posts, Certificate types and Teachers each have their own icon", () => {
    const groups = renderNav()
    const all = groups.flatMap((group) => group.items)
    const icons = ["/login-cues/", "/bot-posts/", "/certificate-types/", "/teachers/"].map(
      (url) => all.find((item) => item.url === url)?.icon,
    )

    expect(icons.every((icon) => icon !== undefined)).toBe(true)
    expect(new Set(icons).size).toBe(4)
    expect(new Set(all.map((item) => item.icon)).size).toBeGreaterThan(all.length / 2)
  })

  test("the groups keep the spec order", () => {
    const groups = renderNav()

    expect(groups.map((group) => group.label)).toEqual([
      "Home",
      "People",
      "Academics",
      "Reports",
      "Operations",
      "Communication",
      "Tools",
    ])
  })
})

import { describe, expect, test } from "bun:test"
import { normalizeFieldLabel, normalizeStudyGroups } from "./study-label"

describe("study field labels", () => {
  test("lower-case English labels are title-cased", () => {
    expect(normalizeFieldLabel("business and technology", "en")).toBe("Business and Technology")
    expect(normalizeFieldLabel("Arts + Academics (BXA)", "en")).toBe("Arts + Academics (BXA)")
  })

  test("other locales get a leading capital only", () => {
    expect(normalizeFieldLabel("финансы и учёт", "ru")).toBe("Финансы и учёт")
  })

  test("duplicates by label are dropped", () => {
    const groups = [
      {
        id: "b",
        label: "Business",
        items: [
          { id: "1", label: "finance" },
          { id: "2", label: "Finance" },
        ],
      },
    ]
    expect(normalizeStudyGroups(groups, "en")[0]?.items).toHaveLength(1)
  })
})

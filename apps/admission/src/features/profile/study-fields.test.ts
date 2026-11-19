import { describe, expect, test } from "bun:test"
import { chosenStudyFields, readStudyFields, toggleStudyField } from "./study-fields"

const groups = [{ id: "g", label: "Sciences", items: [{ id: "physics", label: "Physics" }] }]

describe("study fields of the profile", () => {
  test("reads only string ids from the stored answers", () => {
    expect(readStudyFields({ study_fields: ["physics", "biology"] })).toEqual(["physics", "biology"])
    expect(readStudyFields({ study_fields: "physics" })).toEqual([])
    expect(readStudyFields(undefined)).toEqual([])
  })

  test("toggles an id in and out", () => {
    expect(toggleStudyField(["a"], "b")).toEqual(["a", "b"])
    expect(toggleStudyField(["a", "b"], "a")).toEqual(["b"])
  })

  test("labels come from the taxonomy, a lost id keeps itself", () => {
    expect(chosenStudyFields(groups, ["physics", "gone"])).toEqual([
      { id: "physics", label: "Physics" },
      { id: "gone", label: "gone" },
    ])
  })
})

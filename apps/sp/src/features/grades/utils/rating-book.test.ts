import { describe, expect, test } from "bun:test"
import type { StudentProfile } from "@ihsp/api"
import { bookFields } from "./rating-book"

describe("bookFields", () => {
  test("a student without a group gets the dash", () => {
    const profile = { first_name: "A", last_name: "B", group: null, current_semester: 2 } as StudentProfile
    const fields = bookFields(profile, null, "en")
    expect(fields.group).toBe("-")
    expect(fields.student).toBe("B A")
  })
})

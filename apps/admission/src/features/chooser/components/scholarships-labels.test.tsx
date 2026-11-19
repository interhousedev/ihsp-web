import { screen } from "@testing-library/react"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../../tests/helpers"
import { ScholarshipList } from "./scholarships-table"
import type { Scholarship } from "../types"

const item = (provider: string) =>
  ({
    id: "s1",
    name: "Aid",
    provider,
    basis: "merit",
    country: null,
    cycle: null,
    covers: [],
    url: null,
    coverage_min: null,
    coverage_max: null,
  }) as unknown as Scholarship

describe("scholarship provider label", () => {
  test.each([
    ["institution", "Institution label"],
    ["government", "Government label"],
    ["foundation", "Foundation label"],
  ])("ADM-UZ-2: %s is translated, never shown raw", (value, label) => {
    renderAdmissionApp(<ScholarshipList items={[item(value)]} />, {
      messages: {
        chooser: {
          options: {
            scholarshipProvider: {
              institution: "Institution label",
              government: "Government label",
              foundation: "Foundation label",
            },
          },
        },
      },
    })
    expect(screen.getByText(label)).toBeTruthy()
    expect(screen.queryByText(value)).toBeNull()
  })
})

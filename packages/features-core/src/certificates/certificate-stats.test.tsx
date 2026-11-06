/** CERT-9: statistics of a starred field: its distribution, averages per group and overall, grouped by the field. */
import { describe, expect, test } from "bun:test"
import type { CertificateStats } from "@ihsp/api"
import { apiUrl, certificateTypes, renderWithProviders, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { distributionModel, formatAverage, groupingLabel } from "./certificate-stats"
import { CertificatesStaffView } from "./certificates-staff-view"

const sat = certificateTypes.find((type) => type.code === "sat")!

const starredScores: CertificateStats = {
  types: [
    {
      type_id: sat.id,
      levels: ["75", "80"],
      primary_key: "score",
      primary_kind: "number",
      average: 78.33333,
      groups: [
        { group_id: "g1", group_name: "2TN1", counts: { "75": 1, "80": 1 }, average: 77.5 },
        { group_id: "g2", group_name: "2TN2", counts: { "80": 1 }, average: 80 },
      ],
    },
  ],
}

describe("certificate statistics of a starred number", () => {
  test("formats an average with the locale's decimal sign and no thousands grouping", () => {
    expect(formatAverage(77.5, "en")).toBe("77.5")
    expect(formatAverage(77.5, "ru")).toBe("77,5")
    expect(formatAverage(1175, "en")).toBe("1175")
    expect(formatAverage(null, "en")).toBe("—")
  })

  test("the distribution sums each value over all groups, in the values' order", () => {
    const { rows } = distributionModel(starredScores.types[0], "Certificates")

    expect(rows).toEqual([
      { value: "75", count: 1 },
      { value: "80", count: 2 },
    ])
  })

  test("the grouping is the starred field's label in the locale", () => {
    expect(groupingLabel(certificateTypes, starredScores.types[0], "en")).toBe("Score")
    expect(groupingLabel(certificateTypes, starredScores.types[0], "ru")).toBe("Балл")
  })

  test("the staff view shows the grouping, the average overall and per group, and the distribution", async () => {
    server.use(http.get(apiUrl("/v1/certificates/staff/stats"), () => HttpResponse.json(starredScores)))
    renderWithProviders(<CertificatesStaffView />)

    expect(await screen.findByText("Grouped by Score")).toBeInTheDocument()
    expect(screen.getByText("Average 78.3")).toBeInTheDocument()
    expect(screen.getByText("Average 77.5")).toBeInTheDocument()
    expect(screen.getByText("Average 80")).toBeInTheDocument()
    expect(screen.getByText("75 × 1, 80 × 1")).toBeInTheDocument()
    expect(screen.getByText("80 × 1")).toBeInTheDocument()
  })
})

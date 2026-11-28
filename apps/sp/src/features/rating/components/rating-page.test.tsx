import { describe, expect, it } from "bun:test"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { apiUrl, renderWithProviders, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import en from "../../../../messages/en.json"
import rating from "../../../../messages/en/rating.json"
import { RatingPage } from "./rating-page"

const messages = mergeMessages(en as Messages, rating as Messages)

const breakdown = {
  base: 100,
  certificates: [],
  certificate_points: 0,
  mark_average: 4.5,
  mark_count: 8,
  marks_points: 10,
  absences: 2,
  absence_points: -4,
  work_offs: 1,
  work_off_points: -2,
}

describe("overall rating page", () => {
  it("shows the place, the breakdown and the ranked list", async () => {
    server.use(
      http.get(apiUrl("/v1/me/rating"), () =>
        HttpResponse.json({
          academic_year: { label: "2026/2027", starts_on: "2026-09-01", ends_on: "2027-06-01" },
          weights: {
            base: 100,
            category_points: {},
            level_points: {},
            marks_threshold: 4.5,
            marks_points: 10,
            absence_points: 2,
            work_off_points: 2,
          },
          total: 120,
          top: [
            {
              place: 1,
              student_id: "a",
              full_name: "Aziza K.",
              group_name: "10A",
              score: 130,
              photo_url: null,
              is_me: false,
            },
            {
              place: 7,
              student_id: "b",
              full_name: "Bobur T.",
              group_name: "10B",
              score: 104,
              photo_url: null,
              is_me: true,
            },
          ],
          me: {
            place: 7,
            student_id: "b",
            full_name: "Bobur T.",
            group_name: "10B",
            score: 104,
            photo_url: null,
            is_me: true,
            breakdown,
          },
        }),
      ),
    )
    renderWithProviders(<RatingPage />, { messages, route: "/rating/" })

    expect(await screen.findByText("Your place 7 of 120")).toBeInTheDocument()
    expect(screen.getByText("Academic year 2026/2027")).toBeInTheDocument()
    expect(screen.getByText("Aziza K.")).toBeInTheDocument()
  })
})

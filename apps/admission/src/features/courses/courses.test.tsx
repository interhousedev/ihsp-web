import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { CoursesPage } from "./components/courses-page"

const base = { source_ref: null, provider: null, level: null, year: null, grade: null, included: true }

describe("courses page", () => {
  test("groups courses by source and explains an empty source", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/courses"), () =>
        HttpResponse.json({
          items: [
            { ...base, id: "a1", source: "academic", title: "Algebra" },
            { ...base, id: "m1", source: "manual", title: "Summer school" },
          ],
        }),
      ),
    )
    renderAdmissionApp(<CoursesPage />)
    expect(await screen.findByText("Algebra")).toBeTruthy()
    expect(screen.getByText("Summer school")).toBeTruthy()
    expect(screen.getByText("You are not enrolled in any LMS course yet.")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add a course" })).toBeTruthy()
  })
})

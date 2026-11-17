import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { profile, question, useSetupHandlers, wizardConfig } from "../../tests/admission-handlers"
import { mockChooser } from "../../tests/chooser-handlers"
import { mockQuizzes } from "../../tests/quiz-handlers"
import { ProfilePage } from "./components/profile-page"

describe("profile page", () => {
  test("shows completion and missing details, and autosaves an intended study field from the chooser catalog", async () => {
    const store = mockQuizzes()
    mockChooser()
    useSetupHandlers(wizardConfig([question({ id: "q20", section: "goals" })]), profile())
    server.use(
      http.get(apiUrl("/v1/admission/me/words"), () => HttpResponse.json({ words: [] })),
      http.get(apiUrl("/v1/admission/career"), () =>
        HttpResponse.json({
          student_id: "s1",
          answers: {},
          professions: [],
          majors: [],
          minors: [],
          fit: [],
          spike: null,
          lock_version: 1,
        }),
      ),
      http.get(apiUrl("/v1/admission/career/majors"), () => HttpResponse.json({ items: [] })),
    )
    renderAdmissionApp(<ProfilePage />, { route: "/profile/?tab=background" })
    expect(await screen.findByText("40%")).toBeInTheDocument()
    expect(await screen.findByText("Complete the college quiz")).toBeInTheDocument()
    fireEvent.click(await screen.findByRole("button", { name: "Add a field" }))
    fireEvent.click(await screen.findByRole("button", { name: "Physics" }))
    await waitFor(() => expect(store.quizzes.career.answers.study_fields).toEqual(["physics"]))
    expect(await screen.findByRole("button", { name: "Remove Physics", hidden: true })).toBeInTheDocument()
  })
})

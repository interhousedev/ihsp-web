/** B1: the user's own MCP calls, the empty state, and scope labels in every language. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import en from "@ihsp/i18n/messages/en.json"
import ru from "@ihsp/i18n/messages/ru.json"
import uz from "@ihsp/i18n/messages/uz.json"
import { ConnectorActivityPage } from "@ihsp/features-core/id-account"
import { allowSlowTests, LOGGED_IN, renderId } from "./helpers"

allowSlowTests()

const STUDENT_SCOPES = [
  "schedule_read",
  "homework_read",
  "marks_read",
  "attendance_read",
  "materials_read",
  "files_read",
  "flashcards_read",
  "flashcards_write",
  "sync_run",
  "teachers_read",
  "knowledge_read",
  "flashcards_delete",
  "tests_read",
  "tests_write",
  "notebooks_read",
  "notebooks_write",
  "library_read",
  "files_read_all",
  "learning_read",
]

describe("connector activity", () => {
  test("lists a call with its key and outcome", async () => {
    renderId(<ConnectorActivityPage />, { route: "/connectors/activity/", session: LOGGED_IN })

    expect(await screen.findByText("get_marks")).toBeInTheDocument()
    expect(screen.getByText("Claude Desktop")).toBeInTheDocument()
  })

  test("says so when nothing was called", async () => {
    server.use(
      http.get(apiUrl("/v1/id/me/connectors/activity"), () => HttpResponse.json({ items: [], next_cursor: null })),
    )
    renderId(<ConnectorActivityPage />, { route: "/connectors/activity/", session: LOGGED_IN })

    expect(await screen.findByText("Your keys have not made any calls yet.")).toBeInTheDocument()
  })

  test("all 19 student scopes have a label in uz, ru and en", () => {
    for (const messages of [en, ru, uz]) {
      const hints = messages.connectors.scopeHints as Record<string, string>
      expect(STUDENT_SCOPES.filter((scope) => !hints[scope])).toEqual([])
    }
  })
})

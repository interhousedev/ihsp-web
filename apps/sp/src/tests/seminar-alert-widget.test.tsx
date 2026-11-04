/** The seminar_soon alert on the Today alerts widget, in the student's language. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { AlertsWidget } from "../features/today/dashboard/widgets/alerts-widget"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()

beforeEach(() => freezeTime())
afterEach(() => unfreezeTime())

const widget = { id: "w-alerts", kind: "alerts", size: "2x1", color: null, column: 0, row: 0 } as never

describe("seminar_soon on the alerts widget", () => {
  test("names the subject and the start time of the seminar", async () => {
    server.use(
      http.get(apiUrl("/v1/me/alerts"), () =>
        HttpResponse.json([
          {
            kind: "seminar_soon",
            params: { subject_name: "Physics", starts_at: "2026-10-07T10:00:00+05:00", period: 3 },
            action_url: "/timetable/",
          },
        ]),
      ),
    )
    renderSp(<AlertsWidget widget={widget} />)

    expect(await screen.findByText(/Seminar Physics at 10:00/)).toBeInTheDocument()
  })
})

/** DASH-NEXT: when today is over, the today-lessons widget shows the next study day and labels it. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, server, studentToday } from "@ihsp/test-utils"
import { fireEvent, screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { Dashboard } from "../features/today/dashboard/dashboard"
import { LAYOUT_MARK } from "../features/today/dashboard/model"
import { configureTests, freezeTime, renderSp, unfreezeTime } from "./helpers"

configureTests()
beforeEach(freezeTime)
afterEach(unfreezeTime)

describe("DASH-NEXT today lessons after the last lesson", () => {
  test("no lessons today: the tile names the next study day", async () => {
    server.use(
      http.get(apiUrl("/v1/me/dashboard"), () =>
        HttpResponse.json({
          version: 5,
          widgets: [
            {
              id: "0000000d-0000-4000-8000-000000000001",
              kind: "today_lessons",
              size: "2x2",
              x: 0,
              y: 0,
              color: null,
              config: { [LAYOUT_MARK.key]: LAYOUT_MARK.value },
              text_color: null,
            },
          ],
        }),
      ),
      http.get(apiUrl("/v1/me/today"), () =>
        HttpResponse.json({ ...studentToday, lessons: [], next_study_day: "2026-10-08" }),
      ),
    )
    renderSp(<Dashboard />)
    const label = await screen.findByTestId("next-study-day")
    expect(label).toHaveTextContent(/Thu/)
    expect(label.textContent).toMatch(/8/)
  })

  test("the next day's timetable failing shows an error that retries it", async () => {
    let calls = 0
    server.use(
      http.get(apiUrl("/v1/me/dashboard"), () =>
        HttpResponse.json({
          version: 5,
          widgets: [
            {
              id: "0000000d-0000-4000-8000-000000000001",
              kind: "today_lessons",
              size: "2x2",
              x: 0,
              y: 0,
              color: null,
              config: { [LAYOUT_MARK.key]: LAYOUT_MARK.value },
              text_color: null,
            },
          ],
        }),
      ),
      http.get(apiUrl("/v1/me/today"), () =>
        HttpResponse.json({ ...studentToday, lessons: [], next_study_day: "2026-10-08" }),
      ),
      http.get(apiUrl("/v1/me/timetable"), () => {
        calls += 1
        return HttpResponse.json({ title: "x" }, { status: 500 })
      }),
    )
    renderSp(<Dashboard />)
    const retry = await screen.findByRole("button", { name: /try again/i })
    const before = calls
    fireEvent.click(retry)
    await screen.findByRole("button", { name: /try again/i })
    expect(calls).toBeGreaterThan(before)
  })
})

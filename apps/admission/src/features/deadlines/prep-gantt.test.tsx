import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { PrepGantt } from "./components/prep-gantt"
import { buildGantt, mondayOf, utcDay } from "./prep-gantt-model"

describe("buildGantt", () => {
  test("starts on a Monday and keeps today inside the weeks", () => {
    const today = utcDay("2026-03-11")
    const model = buildGantt([], [], today)
    expect(new Date(model.weeks[0]!).getUTCDay()).toBe(1)
    expect(model.weeks[0]).toBe(mondayOf(today - 7 * 86_400_000))
    expect(model.weeks.length).toBeGreaterThanOrEqual(13)
  })
})

describe("PrepGantt", () => {
  test("renders task and test bars and deadline markers", async () => {
    const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)
    server.use(
      http.get(apiUrl("/v1/admission/tasks"), () =>
        HttpResponse.json({
          items: [
            {
              id: "t1",
              title: "Finish SAT vocabulary",
              status: "planned",
              start_date: day(-3),
              deadline: day(10),
              overdue: false,
            },
          ],
        }),
      ),
      http.get(apiUrl("/v1/admission/test-scores/catalog"), () =>
        HttpResponse.json({ can_edit: false, items: [{ id: "sat", names: { en: "SAT" }, sections: [] }] }),
      ),
      http.get(apiUrl("/v1/admission/test-scores"), () =>
        HttpResponse.json({
          can_verify: false,
          is_owner: true,
          summaries: [],
          entries: [
            {
              id: "e1",
              test_id: "sat",
              label: null,
              status: "registered",
              test_date: day(30),
              registration_deadline: day(14),
            },
          ],
        }),
      ),
      http.get(apiUrl("/v1/admission/calendar"), () =>
        HttpResponse.json({
          items: [
            {
              key: "d1",
              source: "university",
              title: "MIT early action",
              day: day(40),
              due_utc: `${day(40)}T00:00:00Z`,
              predicted: false,
              url_path: null,
            },
          ],
        }),
      ),
    )
    renderAdmissionApp(<PrepGantt />)
    expect(await screen.findByRole("link", { name: /Finish SAT vocabulary, / })).toBeTruthy()
    expect(screen.getByRole("link", { name: /^SAT, / })).toBeTruthy()
    expect(screen.getByRole("link", { name: /MIT early action, / })).toBeTruthy()
    expect(screen.getByRole("link", { name: /SAT: registration closes / })).toBeTruthy()
    expect(screen.getByText("Today")).toBeTruthy()
    expect(screen.getAllByText(/^SAT · /).length).toBeGreaterThan(0)
  })
})

describe("PrepGantt in Uzbek", () => {
  test("ADM-UZ-1: month and week labels never read M10 / M11", async () => {
    const day = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10)
    server.use(
      http.get(apiUrl("/v1/admission/tasks"), () =>
        HttpResponse.json({
          items: [{ id: "t1", title: "Task", status: "planned", start_date: null, deadline: day, overdue: false }],
        }),
      ),
      http.get(apiUrl("/v1/admission/test-scores/catalog"), () => HttpResponse.json({ can_edit: false, items: [] })),
      http.get(apiUrl("/v1/admission/test-scores"), () =>
        HttpResponse.json({ can_verify: false, is_owner: true, summaries: [], entries: [] }),
      ),
      http.get(apiUrl("/v1/admission/calendar"), () => HttpResponse.json({ items: [] })),
    )
    const { container } = renderAdmissionApp(<PrepGantt />, { locale: "uz" })
    await screen.findByRole("link", { name: /Task, / })
    expect(container.textContent).not.toMatch(/\bM\d{1,2}\b/)
  })
})

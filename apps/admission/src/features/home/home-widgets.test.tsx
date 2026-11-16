import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { HomeWidgets } from "./components/home-widgets"

const names = { en: "SAT" }

/** Lets the `Reveal` entrance finish so unmounting does not cancel a running animation. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 300))

function serve(readiness: Record<string, unknown>) {
  server.use(
    http.get(apiUrl("/v1/admission/readiness"), () => HttpResponse.json(readiness)),
    http.get(apiUrl("/v1/admission/calendar"), () =>
      HttpResponse.json({
        items: [
          {
            key: "d1",
            source: "university",
            title: "MIT early action",
            day: "2099-11-01",
            due_utc: "2099-11-01T00:00:00Z",
            predicted: false,
            url_path: null,
          },
        ],
      }),
    ),
    http.get(apiUrl("/v1/admission/tasks"), () =>
      HttpResponse.json({
        items: [
          { id: "t1", title: "Request recommendation", status: "planned", deadline: "2020-01-01", overdue: true },
          { id: "t2", title: "Finished thing", status: "done", deadline: null, overdue: false },
        ],
      }),
    ),
    http.get(apiUrl("/v1/admission/preferences"), () => HttpResponse.json({})),
    http.get(apiUrl("/v1/admission/matches"), () => HttpResponse.json({ items: [], next_cursor: null })),
    http.get(apiUrl("/v1/admission/me/items"), () =>
      HttpResponse.json({
        items: [
          {
            id: "a1",
            kind: "activity",
            title: "Chess club",
            category: "clubs",
            status: "ready",
            hours_per_week: 3,
            weeks_per_year: 30,
          },
        ],
        next_cursor: null,
      }),
    ),
    http.get(apiUrl("/v1/admission/list"), () =>
      HttpResponse.json([
        { id: "l1", bucket: "safety", institution: { name: "Safe College", facts: {} } },
        { id: "l2", bucket: "reach", institution: { name: "Dream Tech", facts: {} } },
      ]),
    ),
    http.get(apiUrl("/v1/admission/test-scores/catalog"), () =>
      HttpResponse.json({ items: [{ id: "sat", key: "sat", names }], can_edit: false }),
    ),
    http.get(apiUrl("/v1/admission/test-scores"), () =>
      HttpResponse.json({
        entries: [{ id: "e1", test_id: "sat", status: "score_received" }],
        summaries: [{ test_id: "sat", best_entry_id: "e1", best_total: 1500 }],
        is_owner: true,
        can_verify: false,
      }),
    ),
  )
}

describe("home widgets", () => {
  test("shows readiness breakdown from the backend and the four widgets", async () => {
    serve({
      percent: 42,
      components: [
        { key: "essays", score: 50, weight: 20, next_action: "write_essay", url_path: "/essays" },
        { key: "major", score: 100, weight: 10, next_action: null, url_path: null },
      ],
    })
    renderAdmissionApp(<HomeWidgets />)
    expect(await screen.findByRole("progressbar", { name: "College readiness" })).toBeTruthy()
    expect(screen.getByText("42%")).toBeTruthy()
    expect(screen.getByText("50% · weight 20")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Write or finish an essay" }).getAttribute("href")).toBe("/essays")
    expect(screen.getByText("Done")).toBeTruthy()
    expect(await screen.findByText("MIT early action")).toBeTruthy()
    expect(await screen.findByText("Request recommendation")).toBeTruthy()
    expect(screen.getByText("Overdue")).toBeTruthy()
    expect(screen.queryByText("Finished thing")).toBeNull()
    expect((await screen.findAllByText("Dream Tech")).length).toBeGreaterThan(0)
    expect(await screen.findByText("Chess club")).toBeTruthy()
    expect(screen.getByText("Revisit your chances")).toBeTruthy()
    expect(screen.queryByText("New here?")).toBeNull()
    expect(await screen.findByText("SAT")).toBeTruthy()
    expect(screen.getByText("best 1500")).toBeTruthy()
    await settle()
  })

  test("shows empty states", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/readiness"), () => HttpResponse.json({ percent: 0, components: [] })),
      http.get(apiUrl("/v1/admission/calendar"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/tasks"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [], next_cursor: null })),
      http.get(apiUrl("/v1/admission/preferences"), () => HttpResponse.json({})),
      http.get(apiUrl("/v1/admission/matches"), () => HttpResponse.json({ items: [], next_cursor: null })),
      http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json([])),
      http.get(apiUrl("/v1/admission/test-scores/catalog"), () => HttpResponse.json({ items: [], can_edit: false })),
      http.get(apiUrl("/v1/admission/test-scores"), () =>
        HttpResponse.json({ entries: [], summaries: [], is_owner: true, can_verify: false }),
      ),
    )
    renderAdmissionApp(<HomeWidgets />)
    expect(await screen.findByText("No deadlines in the next 30 days.")).toBeTruthy()
    expect(await screen.findByText("No open tasks.")).toBeTruthy()
    expect(await screen.findByText("Add universities to your list.")).toBeTruthy()
    expect(await screen.findByText("No activities yet. Add your first one.")).toBeTruthy()
    expect(await screen.findByText("No scores received yet.")).toBeTruthy()
    await settle()
  })
})

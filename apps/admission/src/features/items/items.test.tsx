import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, mock, test } from "bun:test"
import type { ReactNode } from "react"
import * as ui from "@ihsp/ui"
import { renderAdmissionApp } from "../../tests/helpers"
// dnd-kit needs layout to move by keyboard; the stub exercises the `onReorder` contract of `SortableList`.
mock.module("@ihsp/ui", () => ({
  ...ui,
  SortableList: ({
    items,
    onReorder,
    renderItem,
  }: {
    items: { id: string }[]
    onReorder: (items: { id: string }[]) => void
    renderItem: (item: never, index: number) => ReactNode
  }) => (
    <div>
      {items.map((item, index) => (
        <div key={item.id}>{renderItem(item as never, index)}</div>
      ))}
      <button type="button" onClick={() => onReorder([...items].reverse())}>
        swap
      </button>
    </div>
  ),
}))

import { ItemCard } from "./components/item-card"
import { ItemList } from "./components/item-list"
import { PlanBody } from "./components/plan-page"
import { ReviewCard } from "./components/review-card"
import type { Item, Review } from "./api"

const item = (id: string, title: string, position: number): Item => ({
  id,
  kind: "activity",
  title,
  organization: "Org",
  description: "",
  category: null,
  grades: [10],
  hours_per_week: 2,
  weeks_per_year: 30,
  position,
  lock_version: 1,
  metrics: [],
  review: null,
  review_stale: false,
})

const review: Review = {
  id: "r1",
  target_id: "a",
  grades: { clarity: "A", role_name: "B", impact: "C", alignment: "D" },
  overall: "B",
  payload: {
    dimensions: ["clarity", "role_name", "impact", "alignment"].map((dim) => ({
      dim,
      grade: "A",
      evidence: `ev-${dim}`,
      suggestion: "",
    })),
  },
  safety_flag: "none",
  status: "ready",
  created_at: "2026-01-01T00:00:00Z",
}

describe("items", () => {
  test("lists items and creates one", async () => {
    let body: unknown
    let items = [item("a", "Robotics", 0)]
    server.use(
      http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ item_caps: { activities: 10, honors: 5 } })),
      http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items, next_cursor: null })),
      http.post(apiUrl("/v1/admission/me/items"), async ({ request }) => {
        body = await request.json()
        items = [...items, item("b", "Chess", 1)]
        return HttpResponse.json(items[1], { status: 201 })
      }),
    )
    renderAdmissionApp(<ItemList />)
    await screen.findByText("Robotics")
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
    fireEvent.change(await screen.findByLabelText("Position or title"), { target: { value: "Chess" } })
    fireEvent.click(screen.getByRole("button", { name: "Create" }))
    await waitFor(() => expect(body).toMatchObject({ kind: "activity", title: "Chess" }))
  })

  test("renders the four graded dimensions", () => {
    renderAdmissionApp(<ReviewCard review={review} />)
    expect(screen.getByRole("heading", { name: "Overall" })).toBeTruthy()
    expect(screen.getByRole("img", { name: "Impact: grade C" })).toBeTruthy()
    expect(screen.getByRole("img", { name: "Alignment: grade D" })).toBeTruthy()
    expect(screen.getByText(/ev-clarity/)).toBeTruthy()
  })

  test("renders the safeguarding notice without a grade", () => {
    renderAdmissionApp(
      <ReviewCard review={{ ...review, safety_flag: "safeguarding", grades: {}, overall: null, payload: {} }} />,
    )
    expect(screen.getByText(/counselor/)).toBeTruthy()
    expect(screen.queryByRole("img")).toBeNull()
  })

  test("a card links to its editor", () => {
    renderAdmissionApp(<ItemCard item={item("a", "Robotics", 0)} />)
    expect(screen.getByRole("link").getAttribute("href")).toMatch(/^\/activities\/view\/?\?id=a$/)
  })

  test("reorder posts the ids of the new order", async () => {
    let body: unknown
    const items = [item("a", "Robotics", 0), item("b", "Chess", 1)]
    server.use(
      http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ item_caps: { activities: 10, honors: 5 } })),
      http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items, next_cursor: null })),
      http.put(apiUrl("/v1/admission/me/items/order"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ items, next_cursor: null })
      }),
    )
    renderAdmissionApp(<ItemList />)
    fireEvent.click(await screen.findByRole("button", { name: "swap" }))
    await waitFor(() => expect(body).toEqual({ ids: ["b", "a"] }), { timeout: 2000 })
  })
})

describe("plan", () => {
  test("lists milestones and creates one", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/goal-plan"), () =>
        HttpResponse.json({
          items: [
            {
              id: "m1",
              item_id: null,
              title: "Sit the SAT",
              due_month: "2026-10-01",
              target_value: null,
              status: "planned",
              source: "student",
              sort_order: 0,
              lock_version: 1,
            },
          ],
          next_cursor: null,
        }),
      ),
      http.post(apiUrl("/v1/admission/goal-plan/milestones"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    renderAdmissionApp(<PlanBody />)
    expect(await screen.findByText("Sit the SAT")).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Milestone"), { target: { value: "Essay draft" } })
    fireEvent.change(screen.getByLabelText("Target number"), { target: { value: "1500" } })
    fireEvent.click(screen.getByRole("button", { name: "Add milestone" }))
    await waitFor(() => expect(body).toMatchObject({ title: "Essay draft", target_value: 1500 }))
  })

  test("changes status with lock_version and deletes", async () => {
    let patch: unknown
    let deleted = ""
    server.use(
      http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [] })),
      http.get(apiUrl("/v1/admission/goal-plan"), () =>
        HttpResponse.json({
          items: [
            {
              id: "m1",
              item_id: null,
              title: "Sit the SAT",
              due_month: null,
              target_value: null,
              status: "planned",
              source: "student",
              sort_order: 0,
              lock_version: 3,
            },
          ],
          next_cursor: null,
        }),
      ),
      http.patch(apiUrl("/v1/admission/goal-plan/milestones/m1"), async ({ request }) => {
        patch = await request.json()
        return HttpResponse.json({})
      }),
      http.delete(apiUrl("/v1/admission/goal-plan/milestones/m1"), () => {
        deleted = "m1"
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<PlanBody />)
    fireEvent.click(await screen.findByRole("button", { name: "Done" }))
    await waitFor(() => expect(patch).toEqual({ lock_version: 3, status: "done" }))
    fireEvent.click(screen.getByRole("button", { name: "Remove Sit the SAT" }))
    await waitFor(() => expect(deleted).toBe("m1"))
  })
})

describe("plan suggest", () => {
  const plan = http.get(apiUrl("/v1/admission/goal-plan"), () => HttpResponse.json({ items: [], next_cursor: null }))
  const noItems = http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [] }))

  test("accepts a proposal and puts the plan", async () => {
    let put: unknown
    server.use(
      plan,
      noItems,
      http.post(apiUrl("/v1/admission/goal-plan/suggest"), () =>
        HttpResponse.json({
          items: [
            { title: "Take IELTS", item_id: null, due_month: "2026-11-01" },
            { title: "Skip me", item_id: null, due_month: "2026-12-01" },
          ],
        }),
      ),
      http.put(apiUrl("/v1/admission/goal-plan"), async ({ request }) => {
        put = await request.json()
        return HttpResponse.json({ items: [], next_cursor: null })
      }),
    )
    renderAdmissionApp(<PlanBody />)
    fireEvent.click(await screen.findByRole("button", { name: "Suggest milestones" }))
    expect(await screen.findByText("Take IELTS")).toBeTruthy()
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss" })[1])
    fireEvent.click(screen.getByRole("button", { name: "Add" }))
    fireEvent.click(await screen.findByRole("button", { name: "Save plan" }))
    await waitFor(() =>
      expect(put).toEqual({ items: [{ title: "Take IELTS", item_id: null, due_month: "2026-11-01" }] }),
    )
  })

  test("shows the consent and quota errors", async () => {
    let type = "admission/consent_required"
    server.use(
      plan,
      noItems,
      http.post(apiUrl("/v1/admission/goal-plan/suggest"), () =>
        HttpResponse.json(
          { type, title: "x", status: type.endsWith("quota_exceeded") ? 429 : 403, params: {} },
          {
            status: type.endsWith("quota_exceeded") ? 429 : 403,
            headers: { "content-type": "application/problem+json" },
          },
        ),
      ),
    )
    renderAdmissionApp(<PlanBody />)
    fireEvent.click(await screen.findByRole("button", { name: "Suggest milestones" }))
    expect(await screen.findByText("Open consents")).toBeTruthy()
    type = "admission/quota_exceeded"
    fireEvent.click(screen.getByRole("button", { name: "Suggest milestones" }))
    expect(await screen.findByText(/suggestion limit reached/)).toBeTruthy()
  })
})

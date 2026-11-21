import { apiUrl, server } from "@ihsp/test-utils"
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, mock, spyOn, test } from "bun:test"
import { toast } from "sonner"
import * as dnd from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import type { ComponentProps } from "react"
import { testRouter } from "@ihsp/test-utils"
import { renderAdmissionApp } from "../../tests/helpers"

// dnd-kit has no layout in happy-dom, so pointer and keyboard drags cannot run; the board's `onDragEnd` is
// captured and called with the ids a real drag would produce.
const RealDndContext = dnd.DndContext
let dragEnd: ((event: DragEndEvent) => void) | undefined
mock.module("@dnd-kit/core", () => ({
  ...dnd,
  DndContext: (props: ComponentProps<typeof RealDndContext>) => {
    dragEnd = props.onDragEnd
    return <RealDndContext {...props} />
  },
}))

import { ItemBoard } from "./components/item-board"
import { ItemCard } from "./components/item-card"
import { ItemList } from "./components/item-list"
import { ReviewCard } from "./components/review-card"
import type { Item, Review } from "./api"

const item = (id: string, title: string, position: number): Item => ({
  id,
  student_id: "s1",
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
  status: "draft",
  timing: [],
  intend_in_college: null,
  grade: null,
  level: null,
  certificate_entry_id: null,
  grade_stale: false,
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
    expect(testRouter.push).toHaveBeenCalledWith("/?item=new")
    cleanup()
    renderAdmissionApp(<ItemList />, { route: "/?item=new" })
    fireEvent.click(await screen.findByRole("radio", { name: "Arts" }))
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.change(await screen.findByLabelText("Position or title"), { target: { value: "Chess" } })
    fireEvent.click(screen.getByRole("button", { name: "Next" }))
    fireEvent.change(await screen.findByLabelText(/Hours per week/), { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: "Create" }))
    await waitFor(() =>
      expect(body).toMatchObject({ kind: "activity", title: "Chess", category: "arts", hours_per_week: 3 }),
    )
  })

  const graded = (stale = false): Item => ({
    ...item("a", "Robotics", 0),
    grade: { title_grade: "A", title_tip: "Crisp", description_grade: "C", description_tip: "Add detail", model: "m" },
    grade_stale: stale,
  })

  test("a card shows grade pills and regrades on demand", async () => {
    let called = false
    server.use(
      http.post(apiUrl("/v1/admission/me/items/a/grade"), () => {
        called = true
        return HttpResponse.json(graded().grade)
      }),
    )
    renderAdmissionApp(<ItemCard item={graded(true)} />)
    expect(screen.getByRole("img", { name: "Title: grade A" })).toBeTruthy()
    expect(screen.getByRole("img", { name: "Description: grade C" })).toBeTruthy()
    expect(screen.getByText("Edited since it was graded")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Regrade" }))
    await waitFor(() => expect(called).toBe(true))
  })

  test("honors scroll and activities show analytics and the what-if", async () => {
    let message = ""
    server.use(
      http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ item_caps: { activities: 10, honors: 5 } })),
      http.get(apiUrl("/v1/admission/me/items"), () =>
        HttpResponse.json({ items: [graded(), { ...item("h", "Olympiad", 1), kind: "honor" }], next_cursor: null }),
      ),
      http.post(apiUrl("/v1/ai/chats"), () => HttpResponse.json({ id: "c1" }, { status: 201 })),
      http.post(apiUrl("/v1/ai/chats/c1/messages"), async ({ request }) => {
        message = ((await request.json()) as { text: string }).text
        return HttpResponse.json({
          chat: { id: "c1" },
          new_messages: [{ seq: 2, role: "assistant", text: "Keep the club" }],
          status: "done",
        })
      }),
    )
    renderAdmissionApp(<ItemList />)
    await screen.findByText("Robotics")
    expect(screen.getByText("By category")).toBeTruthy()
    expect(screen.getByText("By title grade")).toBeTruthy()
    fireEvent.change(screen.getByLabelText("Test a change to your activities"), { target: { value: "Drop chess" } })
    fireEvent.click(screen.getByRole("button", { name: "Evaluate" }))
    await screen.findByText("Keep the club")
    expect(message).toContain("Drop chess")
  })

  describe("popup editor in the URL", () => {
    const listHandlers = (items: Item[]) =>
      server.use(
        http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ item_caps: { activities: 10, honors: 5 } })),
        http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items, next_cursor: null })),
      )

    test("?item=<id> opens that item's editor and closing clears the param", async () => {
      listHandlers([item("a", "Robotics", 0)])
      testRouter.replace.mockClear()
      renderAdmissionApp(<ItemList />, { route: "/activities/?kind=activity&item=a" })
      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByDisplayValue("Robotics")).toBeTruthy()
      fireEvent.keyDown(dialog, { key: "Escape" })
      await waitFor(() => expect(testRouter.replace).toHaveBeenCalledWith("/activities/?kind=activity"))
    })

    test("?item=new opens the create dialog", async () => {
      listHandlers([item("a", "Robotics", 0)])
      renderAdmissionApp(<ItemList />, { route: "/activities/?item=new" })
      expect(await screen.findByRole("dialog", { name: "New activity" })).toBeTruthy()
    })

    test("?item=new&from=<id> prefills from the planned item", async () => {
      listHandlers([item("a", "Robotics", 0)])
      renderAdmissionApp(<ItemList />, { route: "/activities/?item=new&from=a" })
      await screen.findByRole("dialog", { name: "New activity" })
      fireEvent.click(await screen.findByRole("radio", { name: "Arts" }))
      fireEvent.click(screen.getByRole("button", { name: "Next" }))
      expect(((await screen.findByLabelText("Position or title")) as HTMLInputElement).value).toBe("Robotics")
    })

    test("an unknown id shows a toast and clears the param", async () => {
      listHandlers([item("a", "Robotics", 0)])
      const error = spyOn(toast, "error").mockImplementation(() => "")
      testRouter.replace.mockClear()
      renderAdmissionApp(<ItemList />, { route: "/activities/?item=nope&kind=honor" })
      await waitFor(() => expect(error).toHaveBeenCalled())
      expect(testRouter.replace).toHaveBeenCalledWith("/activities/?kind=honor")
      error.mockRestore()
    })

    test("an empty list suggests where to start", async () => {
      listHandlers([])
      renderAdmissionApp(<ItemList />)
      const link = (name: string) => screen.findByRole("link", { name: new RegExp(name) })
      expect((await link("Take a course")).getAttribute("href")).toBe("/opportunities?kind=course")
      expect((await link("Earn a certification")).getAttribute("href")).toBe("/opportunities?kind=certification")
      expect((await link("mandatory exams")).getAttribute("href")).toBe("/tests")
      expect((await link("Plan it")).getAttribute("href")).toBe("/plan")
    })
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
    expect(screen.getByRole("link").getAttribute("href")).toMatch(/^\/activities\?kind=activity&item=a$/)
  })

  const board = (items: () => Item[]) =>
    server.use(
      http.get(apiUrl("/v1/admission/config"), () =>
        HttpResponse.json({
          item_caps: { activities: 10, honors: 5, drafts: 30 },
          options: { item_grades: ["9", "10"] },
        }),
      ),
      http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: items(), next_cursor: null })),
    )

  test("a card moves from Draft to Ready after marking it ready", async () => {
    let current = [item("a", "Robotics", 0)]
    board(() => current)
    server.use(
      http.patch(apiUrl("/v1/admission/me/items/a"), async () => {
        current = [{ ...current[0]!, status: "ready" }]
        return HttpResponse.json(current[0])
      }),
    )
    renderAdmissionApp(<ItemList />, { route: "/activities/?kind=activity&item=a" })
    await screen.findByRole("dialog")
    expect(within(screen.getByRole("region", { name: "Draft", hidden: true })).getByText("Robotics")).toBeTruthy()
    fireEvent.click(await screen.findByRole("radio", { name: "Ready" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() =>
      expect(within(screen.getByRole("region", { name: "Ready", hidden: true })).getByText("Robotics")).toBeTruthy(),
    )
  })

  test("marking ready with missing fields shows field errors", async () => {
    board(() => [item("a", "Robotics", 0)])
    server.use(
      http.patch(apiUrl("/v1/admission/me/items/a"), () =>
        HttpResponse.json(
          { type: "admission/item_incomplete", title: "Incomplete", status: 422, params: { fields: ["category"] } },
          { status: 422, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<ItemList />, { route: "/activities/?kind=activity&item=a" })
    await screen.findByRole("dialog")
    fireEvent.click(await screen.findByRole("radio", { name: "Ready" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Required to mark as ready")).toBeTruthy()
  })

  const drop = (active: string, over: string) =>
    act(() => dragEnd?.({ active: { id: active }, over: { id: over } } as DragEndEvent))

  test("dragging a card onto the other column moves an activity to Ready", async () => {
    let body: unknown
    let current = [item("a", "Robotics", 0)]
    board(() => current)
    server.use(
      http.patch(apiUrl("/v1/admission/me/items/a"), async ({ request }) => {
        body = await request.json()
        current = [{ ...current[0]!, status: "ready", lock_version: 2 }]
        return HttpResponse.json(current[0])
      }),
    )
    renderAdmissionApp(<ItemList />)
    await screen.findByText("Robotics")
    await drop("a", "column:ready")
    // The card jumps at once, before the server answers.
    await waitFor(() =>
      expect(within(screen.getByRole("region", { name: "Ready" })).getByText("Robotics")).toBeTruthy(),
    )
    await waitFor(() => expect(body).toEqual({ status: "ready", lock_version: 1 }))
    expect(within(screen.getByRole("region", { name: "Ready" })).getByText("Robotics")).toBeTruthy()
  })

  test("dragging a honor onto a card of the other column moves it back to Draft", async () => {
    let body: unknown
    const honor = { ...item("h", "Olympiad", 0), kind: "honor" as const, status: "ready" as const }
    server.use(
      http.patch(apiUrl("/v1/admission/me/items/h"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ ...honor, status: "draft" })
      }),
    )
    renderAdmissionApp(
      <ItemBoard drafts={[item("d", "Chess", 0)]} ready={[honor]} onEdit={() => {}} onDelete={() => {}} />,
    )
    await drop("h", "item:d")
    await waitFor(() => expect(body).toEqual({ status: "draft", lock_version: 1 }))
  })

  test("a refused move returns the card and offers Add details in a toast", async () => {
    const message = spyOn(toast, "message").mockImplementation(() => "")
    board(() => [item("a", "Robotics", 0)])
    server.use(
      http.patch(apiUrl("/v1/admission/me/items/a"), () =>
        HttpResponse.json(
          { type: "admission/item_incomplete", title: "Incomplete", status: 422, params: { fields: ["category"] } },
          { status: 422, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<ItemList />)
    await screen.findByText("Robotics")
    await drop("a", "column:ready")
    await waitFor(() => expect(message).toHaveBeenCalled())
    const [text, options] = message.mock.calls[0] as unknown as [string, { action: { label: string } }]
    expect(text).toMatch(/needs a few more details/)
    expect(options.action.label).toBe("Add details")
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(within(screen.getByRole("region", { name: "Draft" })).getByText("Robotics")).toBeTruthy()
    message.mockRestore()
  })

  test("dropping a card on another card of its column posts the new order", async () => {
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
    await screen.findByText("Chess")
    await drop("a", "item:b")
    await waitFor(() => expect(body).toEqual({ ids: ["b", "a"] }), { timeout: 2000 })
  })
})

describe("pathway links", () => {
  test("activities suggest exploring universities", async () => {
    server.use(http.get(apiUrl("/v1/admission/me/items"), () => HttpResponse.json({ items: [], next_cursor: null })))
    renderAdmissionApp(<ItemList />, {
      messages: { items: { nextStep: { explore: "Explore universities", exploreHint: "h" } } },
    })
    const link = await screen.findByRole("link", { name: /Explore universities/ })
    expect(link.getAttribute("href")).toBe("/chooser?step=match")
  })
})

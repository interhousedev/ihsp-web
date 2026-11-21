import { apiUrl, server, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { Task } from "./api"
import { TaskDrawer } from "./components/task-drawer"
import { TasksBody } from "./components/tasks-page"

const vocab = {
  task_statuses: ["planned", "in_progress", "in_review", "blocked", "done"],
  task_priorities: ["low", "medium", "high"],
  task_sources: ["student", "mentor", "counselor", "ai"],
  task_link_kinds: ["external", "internal"],
  task_horizons: ["overdue", "week", "month"],
}

const task: Task = {
  id: "t1",
  student_id: "s1",
  title: "Draft the Common App essay",
  description: "Write **two** drafts",
  status: "in_progress",
  priority: "high",
  start_date: "2026-01-01",
  deadline: "2026-02-01",
  list_entry_id: null,
  assigned_by_name: null,
  created_by: "mentor",
  creator_id: "m1",
  steps: [
    { id: "a1", title: "Outline", done: true, link: null },
    { id: "a2", title: "First draft", done: false, link: { label: "Essays", url: "/essays/", kind: "internal" } },
  ],
  links: [
    { label: "Prompts", url: "https://example.org/prompts", kind: "external" },
    { label: "Essays page", url: "/essays/", kind: "internal" },
  ],
  progress: { done: 1, total: 2 },
  overdue: true,
  completed_at: null,
  lock_version: 3,
  created_at: "2025-12-01T00:00:00Z",
  updated_at: "2025-12-01T00:00:00Z",
}

const uniLink = { label: "MIT", url: "/chooser/institution/?id=inst1", kind: "internal" } as const
const uniTask: Task = { ...task, id: "t2", title: "MIT supplement", links: [uniLink], overdue: false }
const listEntry = { id: "e1", institution: { id: "inst1", name: "MIT" } }

let route = "/tasks/"

function serve(items: Task[] = [task], list: unknown[] = []) {
  server.use(
    http.get(apiUrl("/v1/admission/list"), () => HttpResponse.json(list)),
    http.get(apiUrl("/v1/admission/test-scores"), () => HttpResponse.json({ entries: [], summaries: [] })),
    http.get(apiUrl("/v1/admission/test-scores/catalog"), () => HttpResponse.json({ items: [] })),
    http.get(apiUrl("/v1/admission/calendar"), () =>
      HttpResponse.json({
        items: [
          {
            key: "uni:e1:ED:2026-12-01",
            source: "university",
            title: "Early Decision: MIT",
            day: "2026-12-01",
            due_utc: "2026-12-01T18:59:59Z",
            predicted: false,
            url_path: "/chooser/institution/?id=inst1",
          },
        ],
      }),
    ),
    http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ workflow: vocab })),
    http.get(apiUrl("/v1/admission/tasks"), () => HttpResponse.json({ items })),
  )
}

describe("tasks list", () => {
  beforeEach(() => (route = "/tasks/?view=list"))
  afterEach(() => (route = "/tasks/"))

  test("shows name, source, overdue badge and priority", async () => {
    serve()
    renderAdmissionApp(<TasksBody />, { route })
    expect((await screen.findAllByText("Draft the Common App essay")).length).toBeGreaterThan(0)
    expect(screen.getAllByText("Overdue").length).toBeGreaterThan(0)
    expect(screen.getAllByText("High").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Mentor").length).toBeGreaterThan(0)
  })

  test("the chosen view goes into the URL", async () => {
    serve()
    const { user } = renderAdmissionApp(<TasksBody />, { route })
    await user.click(await screen.findByRole("tab", { name: "Board" }))
    expect(testRouter.replace).toHaveBeenCalledWith("/tasks/?view=board")
  })

  test("the inline status select patches the task with its lock version", async () => {
    serve()
    let body: Record<string, unknown> | null = null
    server.use(
      http.patch(apiUrl("/v1/admission/tasks/t1"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...task, status: "done" })
      }),
    )
    const { user } = renderAdmissionApp(<TasksBody />, { route })
    const [select] = await screen.findAllByRole("combobox", { name: "Status of Draft the Common App essay" })
    await user.click(select)
    await user.click(await screen.findByRole("option", { name: "Done" }))
    await waitFor(() => expect(body).toEqual({ status: "done", lock_version: 3 }))
  })

  test("filters are sent to the backend", async () => {
    let seen = ""
    server.use(
      http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ workflow: vocab })),
      http.get(apiUrl("/v1/admission/tasks"), ({ request }) => {
        seen = new URL(request.url).search
        return HttpResponse.json({ items: [] })
      }),
    )
    const { user } = renderAdmissionApp(<TasksBody />, { route })
    await user.click(await screen.findByRole("combobox", { name: "Priority" }))
    await user.click(await screen.findByRole("option", { name: "High" }))
    await waitFor(() => expect(seen).toContain("priority=high"))
  })
})

describe("tasks board", () => {
  beforeEach(() => (route = "/tasks/"))

  test("puts a task in the column of its status", async () => {
    serve()
    renderAdmissionApp(<TasksBody />, { route })
    fireEvent.click(await screen.findByRole("tab", { name: "Board" }))
    const column = await screen.findByRole("region", { name: "In progress" })
    expect(within(column).getByText("Draft the Common App essay")).toBeTruthy()
    expect(screen.getByRole("region", { name: "Blocked" })).toBeTruthy()
    expect(within(screen.getByRole("region", { name: "Done" })).queryByText("Draft the Common App essay")).toBeNull()
  })
})

describe("tasks deadlines view", () => {
  beforeEach(() => (route = "/tasks/"))

  test("is the default and groups per university, general and own tasks", async () => {
    serve([task, uniTask], [listEntry])
    renderAdmissionApp(<TasksBody />, { route })
    expect(await screen.findByRole("button", { name: /Draft the Common App essay/ })).toBeTruthy()
    expect(screen.getByRole("tab", { name: "Deadlines", selected: true })).toBeTruthy()
    expect(screen.getByText("MIT")).toBeTruthy()
    expect(screen.getByText("My tasks")).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add a task to MIT" })).toBeTruthy()
    expect(screen.getByRole("button", { name: "Add a task to My tasks" })).toBeTruthy()
  })

  test("a bar opens the task", async () => {
    serve([uniTask], [listEntry])
    const { user } = renderAdmissionApp(<TasksBody />, { route })
    await user.click(await screen.findByRole("button", { name: /MIT supplement/ }))
    expect(await screen.findByText("1 of 2 steps")).toBeTruthy()
  })

  test("the (+) of a university opens the form with that university linked", async () => {
    serve([], [listEntry])
    let body: Record<string, unknown> | null = null
    server.use(
      http.post(apiUrl("/v1/admission/tasks"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...task, id: "new" })
      }),
    )
    const { user } = renderAdmissionApp(<TasksBody />, { route })
    await user.click(await screen.findByRole("button", { name: "Add a task to MIT" }))
    await user.type(await screen.findByLabelText("Name"), "Visit campus")
    await user.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(body?.links).toEqual([uniLink]))
  })
})

describe("task drawer", () => {
  test("renders markdown, links and the step progress", async () => {
    serve()
    renderAdmissionApp(<TaskDrawer task={task} open onOpenChange={() => {}} />)
    expect(await screen.findByText("two")).toBeTruthy()
    const external = screen.getByRole("link", { name: /Prompts/ })
    expect(external.getAttribute("target")).toBe("_blank")
    expect(screen.getByRole("link", { name: "Essays page" }).getAttribute("href")).toMatch(/^\/essays\/?$/)
    expect(screen.getByText("1 of 2 steps")).toBeTruthy()
  })

  test("shows who assigned the task, and nothing for a task of the student", async () => {
    serve()
    const { unmount } = renderAdmissionApp(
      <TaskDrawer task={{ ...task, assigned_by_name: "Dilnoza Counselor" }} open onOpenChange={() => {}} />,
    )
    expect(await screen.findByText(/Dilnoza Counselor/)).toBeTruthy()
    unmount()
    renderAdmissionApp(<TaskDrawer task={task} open onOpenChange={() => {}} />)
    await screen.findByText("two")
    expect(screen.queryByText(/Dilnoza/)).toBeNull()
  })

  test("ticking a step patches it and does not close the task", async () => {
    serve()
    let body: Record<string, unknown> | null = null
    let url = ""
    server.use(
      http.patch(apiUrl("/v1/admission/tasks/t1/steps/a2"), async ({ request }) => {
        url = new URL(request.url).pathname
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(task)
      }),
    )
    renderAdmissionApp(<TaskDrawer task={task} open onOpenChange={() => {}} />)
    fireEvent.click(await screen.findByRole("checkbox", { name: "First draft" }))
    await waitFor(() => expect(body).toEqual({ done: true }))
    expect(url).toEndWith("/tasks/t1/steps/a2")
  })
})

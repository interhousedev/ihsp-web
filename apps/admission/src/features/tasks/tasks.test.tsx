import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
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

function serve(items: Task[] = [task]) {
  server.use(
    http.get(apiUrl("/v1/admission/config"), () => HttpResponse.json({ workflow: vocab })),
    http.get(apiUrl("/v1/admission/tasks"), () => HttpResponse.json({ items })),
  )
}

describe("tasks list", () => {
  test("shows name, source, overdue badge and priority", async () => {
    serve()
    renderAdmissionApp(<TasksBody />)
    expect((await screen.findAllByText("Draft the Common App essay")).length).toBeGreaterThan(0)
    expect(screen.getAllByText("Overdue").length).toBeGreaterThan(0)
    expect(screen.getAllByText("High").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Mentor").length).toBeGreaterThan(0)
  })

  test("the chosen view is remembered", async () => {
    serve()
    localStorage.removeItem("admission.tasks.view")
    const { user } = renderAdmissionApp(<TasksBody />)
    await user.click(await screen.findByRole("tab", { name: "Board" }))
    expect(localStorage.getItem("admission.tasks.view")).toBe("board")
    localStorage.removeItem("admission.tasks.view")
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
    const { user } = renderAdmissionApp(<TasksBody />)
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
    const { user } = renderAdmissionApp(<TasksBody />)
    await user.click(await screen.findByRole("combobox", { name: "Priority" }))
    await user.click(await screen.findByRole("option", { name: "High" }))
    await waitFor(() => expect(seen).toContain("priority=high"))
  })
})

describe("tasks board", () => {
  test("puts a task in the column of its status", async () => {
    serve()
    renderAdmissionApp(<TasksBody />)
    fireEvent.click(await screen.findByRole("tab", { name: "Board" }))
    const column = await screen.findByRole("region", { name: "In progress" })
    expect(within(column).getByText("Draft the Common App essay")).toBeTruthy()
    expect(screen.getByRole("region", { name: "Blocked" })).toBeTruthy()
    expect(within(screen.getByRole("region", { name: "Done" })).queryByText("Draft the Common App essay")).toBeNull()
  })
})

describe("tasks timeline", () => {
  test("draws a bar for a dated task", async () => {
    serve()
    renderAdmissionApp(<TasksBody />)
    fireEvent.click(await screen.findByRole("tab", { name: "Timeline" }))
    expect(await screen.findByRole("button", { name: /Draft the Common App essay/ })).toBeTruthy()
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

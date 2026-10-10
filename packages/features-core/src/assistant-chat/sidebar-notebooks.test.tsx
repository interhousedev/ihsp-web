import { describe, expect, it } from "bun:test"
import { apiUrl, notebookItems, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import { SidebarNotebooks } from "./sidebar-notebooks"

allowSlowRenders()

function make(count: number, origin: "subject_auto" | "course" | "manual", label: string) {
  return Array.from({ length: count }, (_, index) => ({
    ...notebookItems[0],
    id: `0000001e-0000-4000-8000-${origin.length}${String(index).padStart(3, "0")}${label.length}00000`.slice(0, 36),
    title: `${label} ${index + 1}`,
    origin,
  }))
}

describe("SidebarNotebooks folders", () => {
  it("shows five per folder, the counts and a show-all link", async () => {
    const items = [...make(30, "subject_auto", "Subject"), ...make(7, "course", "Course"), ...make(2, "manual", "Own")]
    server.use(http.get(apiUrl("/v1/notebooks"), () => HttpResponse.json({ items, next_cursor: null })))
    const { user } = renderNotebook(<SidebarNotebooks onNavigate={() => {}} />, { route: "/assistant/" })

    await screen.findByText("Subject 1")
    const subject = document.querySelector('[data-folder="subject"]') as HTMLElement
    const course = document.querySelector('[data-folder="course"]') as HTMLElement
    const mine = document.querySelector('[data-folder="mine"]') as HTMLElement
    expect(within(subject).getAllByRole("link").length).toBe(6)
    expect(within(subject).getByRole("link", { name: "Show all (30)" }).getAttribute("href")).toContain("folder=subject")
    expect(within(subject).getByRole("button", { name: /Subject notebooks/ })).toHaveTextContent("30")
    expect(within(course).getAllByRole("link").length).toBe(6)
    expect(within(course).getByRole("button", { name: /Course notebooks/ })).toHaveTextContent("7")
    expect(within(mine).getAllByRole("link").length).toBe(2)
    expect(within(mine).queryByRole("link", { name: /Show all/ })).toBeNull()

    await user.click(within(subject).getByRole("button", { name: /Subject notebooks/ }))
    expect(within(subject).queryAllByRole("link").length).toBe(0)
    expect(window.localStorage.getItem("ihsp.assistant.notebook-folders.collapsed")).toContain("subject")
  })

  it("counts every page of the list, not only the first one", async () => {
    const withId = (items: ReturnType<typeof make>, prefix: string) =>
      items.map((item, index) => ({ ...item, id: `${prefix}-${String(index).padStart(12, "0")}` }))
    const first = withId(make(100, "subject_auto", "Page one"), "00000001-0000-4000-8000")
    const second = withId(make(30, "subject_auto", "Page two"), "00000002-0000-4000-8000")
    server.use(
      http.get(apiUrl("/v1/notebooks"), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor")
        return HttpResponse.json(cursor === null ? { items: first, next_cursor: "page-2" } : { items: second, next_cursor: null })
      }),
    )
    renderNotebook(<SidebarNotebooks onNavigate={() => {}} />, { route: "/assistant/" })

    const subject = await waitFor(() => {
      const element = document.querySelector('[data-folder="subject"]') as HTMLElement | null
      expect(element).not.toBeNull()
      expect(within(element as HTMLElement).getByRole("button", { name: /Subject notebooks/ })).toHaveTextContent("130")
      return element as HTMLElement
    })
    expect(within(subject).getByRole("link", { name: "Show all (130)" })).toBeInTheDocument()
  })
})

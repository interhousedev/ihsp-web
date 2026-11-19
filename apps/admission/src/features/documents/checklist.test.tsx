import { apiUrl, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import type { ChecklistItem } from "./api"
import { ChecklistSection } from "./components/checklist-section"

const base: ChecklistItem = {
  id: "1",
  template_key: "entry.essay",
  title_key: "essay",
  list_entry_id: null,
  owner: "student",
  status: "todo",
  due_utc: null,
  document_id: null,
  source_url: null,
  important: false,
  urgent_override: null,
  institution_name: null,
  app_path: null,
  urgent: false,
  quadrant: "drop",
}

function serve(items: ChecklistItem[]) {
  server.use(http.get(apiUrl("/v1/admission/checklist"), () => HttpResponse.json(items)))
}

describe("checklist", () => {
  test("renders the in-app page link and the staff external link", async () => {
    serve([{ ...base, app_path: "/essays/", source_url: "https://example.org/form" }])
    renderAdmissionApp(<ChecklistSection />)
    expect((await screen.findByRole("link", { name: "Open the page" })).getAttribute("href")).toMatch(/^\/essays\/?$/)
    const ext = screen.getByRole("link", { name: /Open the link/ })
    expect(ext.getAttribute("href")).toBe("https://example.org/form")
    expect(ext.getAttribute("target")).toBe("_blank")
  })

  test("the priorities view groups by quadrant", async () => {
    serve([
      { ...base, id: "a", important: true, urgent: true, quadrant: "do" },
      { ...base, id: "b", title_key: "passport", quadrant: "drop" },
    ])
    const { user } = renderAdmissionApp(<ChecklistSection />)
    await user.click(await screen.findByRole("button", { name: "Priorities" }))
    const doGroup = screen.getByRole("region", { name: "Checklist" }).querySelector("#quadrant-do")?.parentElement
    if (!doGroup) throw new Error("missing quadrant")
    expect(within(doGroup).getAllByRole("listitem")).toHaveLength(1)
  })

  test("the importance toggle patches the item", async () => {
    serve([base])
    let body: Record<string, unknown> | null = null
    server.use(
      http.patch(apiUrl("/v1/admission/checklist/1"), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...base, important: true })
      }),
    )
    const { user } = renderAdmissionApp(<ChecklistSection />)
    await user.click(await screen.findByRole("button", { name: "Important" }))
    await screen.findByRole("button", { name: "Important" })
    expect(body as unknown).toEqual({ important: true })
  })

  test("shows the institution logo, or initials when there is none", async () => {
    serve([
      {
        ...base,
        id: "a",
        institution_name: "Harvard University",
        logo_url: "https://cdn.example/h.png",
        logo_fit: "circle",
        logo_zoom: 1,
      },
      { ...base, id: "b", institution_name: "Yale College", logo_url: null, logo_fit: "contain", logo_zoom: 1 },
    ])
    const { container } = renderAdmissionApp(<ChecklistSection />)
    await screen.findAllByText(/Harvard University/)
    expect(
      container.querySelector('img[src="https://cdn.example/h.png"]') ?? screen.queryAllByText("HU")[0],
    ).not.toBeNull()
    expect(screen.getAllByText("YC").length).toBeGreaterThan(0)
  })

  test("ADM-DOCS-1 a group shows its next open deadline and the official portal", async () => {
    serve([
      {
        ...base,
        id: "a",
        institution_name: "Uni A",
        due_utc: "2027-03-10T00:00:00Z",
        institution_website_url: "https://uni.example/apply",
      },
      { ...base, id: "b", institution_name: "Uni A", due_utc: "2027-02-01T00:00:00Z" },
    ])
    renderAdmissionApp(<ChecklistSection />)
    const portal = await screen.findByRole("link", { name: /Open official portal/ })
    expect(portal.getAttribute("href")).toBe("https://uni.example/apply")
    expect(portal.getAttribute("target")).toBe("_blank")
    expect(screen.getAllByText(/Next deadline/).length).toBeGreaterThan(0)
  })

  test("ADM-DOCS-2 ?entry= opens and highlights that university", async () => {
    serve([
      { ...base, id: "a", institution_name: "Uni A", list_entry_id: "e1" },
      { ...base, id: "b", institution_name: "Uni B", list_entry_id: "e2" },
    ])
    const { container } = renderAdmissionApp(<ChecklistSection />, { route: "/documents/?entry=e2" })
    await screen.findByText("Uni B")
    const open = container.querySelectorAll("details[open]")
    expect(open.length).toBe(1)
    expect(open[0].getAttribute("data-focused")).toBe("true")
    expect(open[0].textContent).toContain("Uni B")
  })
})

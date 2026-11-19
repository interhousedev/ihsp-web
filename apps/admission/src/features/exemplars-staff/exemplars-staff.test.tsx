import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import type { Messages } from "@ihsp/i18n"
import { renderAdmissionApp } from "../../tests/helpers"
import type { Exemplar } from "./api"
import { ExemplarDialog } from "./components/exemplar-dialog"
import { ExemplarsStaffBody } from "./components/exemplars-staff-page"

const PATH = "/v1/admission/staff/exemplars"

const messages = {
  exemplarsStaff: {
    title: "Exemplars",
    emptyTitle: "No exemplars",
    searchLabel: "Search",
    fieldTitle: "Title",
    fieldBody: "Essay text",
    fieldSourceUrl: "Source URL",
    fieldYear: "Year",
    fieldStatus: "Status",
    anyStatus: "Any status",
    save: "Save",
    saved: "Saved",
    create: "Add",
    edit: "Edit",
    archive: "Archive",
    duplicate: "This exemplar is already in the library",
    words: "{count} words",
    kind: { personal_statement: "Personal statement" },
    status: { draft: "Draft", published: "Published", archived: "Archived" },
  },
} as unknown as Messages

const item: Exemplar = {
  id: "e1",
  title: "Why Oxford",
  kind: "personal_statement",
  status: "draft",
  institution_id: null,
  school_name: "Oxford",
  year: 2025,
  language: "en",
  prompt: "",
  source_name: "Oxford site",
  source_url: "https://example.edu/essay",
  notes: "",
  body: "one two three",
  tags: ["stem"],
  word_count: 3,
  lock_version: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
}

function fill() {
  fireEvent.change(document.getElementById("ex-title") as HTMLInputElement, { target: { value: "Essay A" } })
  fireEvent.change(document.getElementById("ex-source-url") as HTMLInputElement, {
    target: { value: "https://example.edu/a" },
  })
  fireEvent.change(document.getElementById("ex-body") as HTMLTextAreaElement, { target: { value: "alpha beta gamma" } })
}

describe("exemplars staff", () => {
  test("the library renders its rows", async () => {
    server.use(http.get(apiUrl(PATH), () => HttpResponse.json({ items: [item], total: 1 })))
    renderAdmissionApp(<ExemplarsStaffBody />, { messages })
    expect(await screen.findByText("Why Oxford")).toBeTruthy()
    expect(screen.getByText("Draft")).toBeTruthy()
  })

  test("create sends the form as the payload and shows the word count", async () => {
    let body: Record<string, unknown> | undefined
    server.use(
      http.post(apiUrl(PATH), async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(item)
      }),
    )
    renderAdmissionApp(<ExemplarDialog open onOpenChange={() => {}} />, { messages })
    await screen.findByText("Title")
    fill()
    expect(screen.getByTestId("ex-word-count").textContent).toBe("3 words")
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(body).toBeDefined())
    expect(body).toMatchObject({
      title: "Essay A",
      kind: "personal_statement",
      status: "draft",
      body: "alpha beta gamma",
      source_url: "https://example.edu/a",
      year: null,
      institution_id: null,
    })
  })

  test("a duplicate is explained in the dialog", async () => {
    server.use(
      http.post(apiUrl(PATH), () =>
        HttpResponse.json({ type: "admission/exemplar_duplicate", title: "Duplicate", status: 409 }, { status: 409 }),
      ),
    )
    renderAdmissionApp(<ExemplarDialog open onOpenChange={() => {}} />, { messages })
    await screen.findByText("Title")
    fill()
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect((await screen.findByRole("alert")).textContent).toBe("This exemplar is already in the library")
  })
})

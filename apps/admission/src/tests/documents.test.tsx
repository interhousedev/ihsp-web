/** Officer Done and Undo, the student checklist, and a document upload. */
import { describe, expect, it } from "bun:test"
import { apiUrl, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { ChecklistSection } from "../features/documents/components/checklist-section"
import { UploadForm } from "../features/documents/components/upload-form"
import { OfficerQueue } from "../features/transcripts/components/officer-queue"
import { TranscriptSection } from "../features/transcripts/components/transcript-section"
import { renderAdmissionApp } from "./helpers"

const ID = "22222222-2222-4222-8222-222222222222"
const transcript = (over: object = {}) => ({
  id: ID,
  student_id: null,
  student_name: "Aziza Karimova",
  class_name: "11A",
  destination_note: "MIT",
  status: "requested",
  requested_at: "2026-03-01T08:00:00Z",
  ready_at: null,
  undo_until: null,
  pickup_location: null,
  document_id: null,
  lock_version: 3,
  ...over,
})

describe("transcript officer queue", () => {
  it("marks a request done with its lock version, then undoes it", async () => {
    let current = transcript()
    const bodies: unknown[] = []
    let undone = false
    server.use(
      http.get(apiUrl("/v1/admission/officer/transcripts"), () => HttpResponse.json([current])),
      http.post(apiUrl(`/v1/admission/officer/transcripts/${ID}/done`), async ({ request }) => {
        bodies.push(await request.json())
        current = transcript({
          status: "ready",
          lock_version: 4,
          undo_until: new Date(Date.now() + 600_000).toISOString(),
        })
        return HttpResponse.json({ request: current, already: false })
      }),
      http.post(apiUrl(`/v1/admission/officer/transcripts/${ID}/undo`), () => {
        undone = true
        current = transcript({ lock_version: 5 })
        return HttpResponse.json(current)
      }),
    )
    renderAdmissionApp(<OfficerQueue />)
    await screen.findByText("Aziza Karimova")

    await userEvent.click(screen.getByRole("button", { name: "Done" }))
    await waitFor(() => expect(bodies).toEqual([{ lock_version: 3 }]))
    const undo = await screen.findByRole("button", { name: "Undo" })

    await userEvent.click(undo)
    await waitFor(() => expect(undone).toBe(true))
    await screen.findByRole("button", { name: "Done" })
  })
})

describe("student transcripts", () => {
  it("shows the pickup place from the API once the paper copy is ready", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/transcripts"), () =>
        HttpResponse.json([transcript({ status: "ready", pickup_location: "Room 12, ground floor" })]),
      ),
    )
    renderAdmissionApp(<TranscriptSection />)
    await screen.findByText("Pick it up at: Room 12, ground floor")
  })
})

describe("student checklist", () => {
  it("lists items and marks one done", async () => {
    const patches: unknown[] = []
    server.use(
      http.get(apiUrl("/v1/admission/checklist"), () =>
        HttpResponse.json([
          {
            id: "c1",
            template_key: "passport",
            title_key: "Passport copy",
            list_entry_id: null,
            owner: "student",
            status: "todo",
            due_utc: null,
            document_id: null,
            source_url: null,
          },
        ]),
      ),
      http.patch(apiUrl("/v1/admission/checklist/c1"), async ({ request }) => {
        patches.push(await request.json())
        return HttpResponse.json({})
      }),
    )
    renderAdmissionApp(<ChecklistSection />)
    await userEvent.click(await screen.findByRole("checkbox", { name: "Passport copy" }))
    await waitFor(() => expect(patches).toEqual([{ status: "done" }]))
  })

  it("shows the empty state", async () => {
    server.use(http.get(apiUrl("/v1/admission/checklist"), () => HttpResponse.json([])))
    renderAdmissionApp(<ChecklistSection />)
    await screen.findByText(/Nothing to prepare yet/)
  })
})

describe("document upload", () => {
  it("posts the chosen file as multipart with the kind", async () => {
    let kind: FormDataEntryValue | null = null
    let name = ""
    server.use(
      http.post(apiUrl("/v1/admission/documents"), async ({ request }) => {
        const form = await request.formData()
        kind = form.get("kind")
        name = (form.get("file") as File).name
        return HttpResponse.json({})
      }),
    )
    renderAdmissionApp(<UploadForm />)
    const file = new File(["x"], "passport.pdf", { type: "application/pdf" })
    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } })
    await waitFor(() => expect(name).toBe("passport.pdf"))
    expect(kind as unknown).toBe("other")
  })
})

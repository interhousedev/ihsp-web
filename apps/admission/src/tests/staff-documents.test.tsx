/** Staff side: reject dialog, officer reminder, pickup form, deadline create, edit and remove. */
import { describe, expect, it } from "bun:test"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw"
import { CreateDeadlineDialog } from "../features/deadlines/components/create-deadline-dialog"
import { StaffDeadlinesPage } from "../features/deadlines/components/staff-deadlines-page"
import { RejectDialog } from "../features/documents/components/reject-dialog"
import { PickupForm } from "../features/transcripts/components/pickup-form"
import { StaffOverview } from "../features/transcripts/components/staff-overview"
import { renderAdmissionApp } from "./helpers"

const ID = "33333333-3333-4333-8333-333333333333"
const INST = "44444444-4444-4444-8444-444444444444"
const staff = { session: { user: { ...userMe, roles: ["counselor" as const] } } }
const configHandler = http.get(apiUrl("/v1/admission/config"), () =>
  HttpResponse.json({
    workflow: {
      reject_reasons: ["illegible", "wrong_document", "expired", "other"],
      deadline_statuses: ["confirmed", "predicted", "unknown", "confirm_with_uni"],
      rounds: [
        { id: "RD", binding: false },
        { id: "ED", binding: true },
      ],
    },
  }),
)
const deadline = {
  id: ID,
  institution_id: INST,
  cycle: 2027,
  round: "RD",
  program_id: null,
  precision: "date",
  source_text: null,
  source_tz: null,
  local_date: "2027-01-05",
  cutoff_time: null,
  instant_utc: null,
  binding: false,
  applies_to: null,
  status: "predicted",
  version: 1,
}

describe("reject dialog", () => {
  it("posts accept=false with the reason code and note", async () => {
    const bodies: unknown[] = []
    server.use(
      configHandler,
      http.post(apiUrl(`/v1/admission/documents/${ID}/review`), async ({ request }) => {
        bodies.push(await request.json())
        return HttpResponse.json({})
      }),
    )
    renderAdmissionApp(<RejectDialog id={ID} open onOpenChange={() => {}} />)
    await userEvent.type(await screen.findByLabelText(/Note for the student/), "Too dark")
    await userEvent.click(screen.getByRole("button", { name: "Reject" }))
    await waitFor(() => expect(bodies).toEqual([{ accept: false, reason_code: "illegible", note: "Too dark" }]))
  })
})

describe("staff transcript overview", () => {
  it("reminds the officer about a requested transcript", async () => {
    let reminded = false
    server.use(
      http.get(apiUrl("/v1/admission/staff/transcripts"), () =>
        HttpResponse.json([
          {
            id: ID,
            student_id: "s1",
            student_name: "Aziza Karimova",
            class_name: "11A",
            destination_note: null,
            status: "requested",
            requested_at: "2026-03-01T08:00:00Z",
            ready_at: null,
            undo_until: null,
            pickup_location: null,
            document_id: null,
            lock_version: 1,
          },
        ]),
      ),
      http.post(apiUrl(`/v1/admission/staff/transcripts/${ID}/remind`), () => {
        reminded = true
        return HttpResponse.json({})
      }),
    )
    renderAdmissionApp(<StaffOverview />, staff)
    await screen.findByText("Aziza Karimova")
    await userEvent.click(screen.getByRole("button", { name: "Remind the officer" }))
    await waitFor(() => expect(reminded).toBe(true))
  })
})

describe("pickup form", () => {
  it("loads the places and saves the edited three-locale value", async () => {
    const puts: unknown[] = []
    server.use(
      http.get(apiUrl("/v1/admission/officer/settings"), () =>
        HttpResponse.json({ pickup_location: { uz: "12-xona", ru: "Кабинет 12", en: "Room 12" } }),
      ),
      http.put(apiUrl("/v1/admission/officer/settings"), async ({ request }) => {
        puts.push(await request.json())
        return HttpResponse.json({ pickup_location: {} })
      }),
    )
    renderAdmissionApp(<PickupForm />)
    const en = await screen.findByDisplayValue("Room 12")
    await userEvent.clear(en)
    await userEvent.type(en, "Room 14")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(puts).toEqual([{ pickup_location: { uz: "12-xona", ru: "Кабинет 12", en: "Room 14" } }]))
  })
})

describe("staff deadlines", () => {
  it("edits the status and date of a deadline", async () => {
    const patches: unknown[] = []
    server.use(
      http.get(apiUrl("/v1/admission/staff/deadlines"), () => HttpResponse.json([deadline])),
      http.patch(apiUrl(`/v1/admission/staff/deadlines/${ID}`), async ({ request }) => {
        patches.push(await request.json())
        return HttpResponse.json(deadline)
      }),
    )
    renderAdmissionApp(<StaffDeadlinesPage />, staff)
    await userEvent.click(await screen.findByRole("button", { name: "Edit" }))
    const date = await screen.findByLabelText("Date")
    await userEvent.clear(date)
    await userEvent.type(date, "2027-01-10")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(patches).toHaveLength(1))
    expect(patches[0]).toEqual({ local_date: "2027-01-10" })
  })

  it("lists the university and a formatted date, and edits the citation alone", async () => {
    const patches: unknown[] = []
    server.use(
      configHandler,
      http.get(apiUrl("/v1/admission/staff/deadlines"), () =>
        HttpResponse.json([{ ...deadline, institution_name: "MIT", status: "confirmed" }]),
      ),
      http.patch(apiUrl(`/v1/admission/staff/deadlines/${ID}`), async ({ request }) => {
        patches.push(await request.json())
        return HttpResponse.json(deadline)
      }),
    )
    renderAdmissionApp(<StaffDeadlinesPage />, staff)
    expect(await screen.findByText("MIT")).toBeTruthy()
    expect(screen.queryByText("2027-01-05")).toBeNull()
    expect(screen.getByText(/Regular Decision \(RD\)/)).toBeTruthy()
    await userEvent.click(screen.getByRole("button", { name: "Edit" }))
    expect(await screen.findByRole("combobox", { name: "Status" })).toBeTruthy()
    await userEvent.type(await screen.findByLabelText("Source quote"), "site")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(patches).toHaveLength(1))
    expect(patches[0]).toEqual({ source_text: "site" })
  })

  it("removes a deadline after confirmation", async () => {
    let removed = false
    server.use(
      http.get(apiUrl("/v1/admission/staff/deadlines"), () => HttpResponse.json(removed ? [] : [deadline])),
      http.delete(apiUrl(`/v1/admission/staff/deadlines/${ID}`), () => {
        removed = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderAdmissionApp(<StaffDeadlinesPage />, staff)
    await userEvent.click(await screen.findByRole("button", { name: "Remove" }))
    const buttons = await screen.findAllByRole("button", { name: "Remove" })
    await userEvent.click(buttons[buttons.length - 1])
    await waitFor(() => expect(removed).toBe(true))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Edit" })).toBeNull())
  })

  it("creates a deadline for a university found by search", async () => {
    const posts: unknown[] = []
    server.use(
      configHandler,
      http.get(apiUrl("/v1/admission/catalog/institutions"), () =>
        HttpResponse.json({ items: [{ id: INST, name: "MIT", country: "US" }], next_cursor: null }),
      ),
      http.post(apiUrl("/v1/admission/staff/deadlines"), async ({ request }) => {
        posts.push(await request.json())
        return HttpResponse.json(deadline)
      }),
    )
    renderAdmissionApp(<CreateDeadlineDialog open onOpenChange={() => {}} />, staff)
    expect(await screen.findByRole("combobox", { name: "Round" })).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "Round" }).textContent).toContain("Regular Decision (RD)"),
    )
    await userEvent.type(await screen.findByLabelText("Search universities"), "mit")
    await userEvent.click(await screen.findByRole("button", { name: "MIT" }))
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(posts).toHaveLength(1))
    expect(posts[0]).toMatchObject({ institution_id: INST, round: "RD", status: "confirmed" })
  })
})

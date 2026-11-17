/** Consultations: the student requests, cancels and confirms; staff confirm from the queue. */
import { describe, expect, it, spyOn } from "bun:test"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { ConsultationsPage } from "../features/consultations/components/consultations-page"
import { StaffConsultationsPage } from "../features/consultations/components/staff-consultations-page"
import { toLocalInput } from "../features/consultations/components/action-dialog"
import { DocumentProcess } from "../features/document-process/components/document-process"
import { validateProofUrl } from "../features/proofs/lib/proof-url"
import { renderAdmissionApp } from "./helpers"

const counselor = { session: { user: { ...userMe, roles: ["counselor" as const] } } }

const consultation = (over: object = {}) => ({
  id: "c1",
  student_id: "s1",
  student_name: "",
  with_kind: "counselor",
  topic: "Essay review",
  linked_kind: "other",
  linked_id: null,
  details: "",
  preferred_times: [],
  format: "online",
  status: "requested",
  staff_id: null,
  scheduled_at: null,
  location: "",
  staff_notes: "",
  decline_reason: "",
  created_at: null,
  updated_at: null,
  completed_at: null,
  viewer: "student",
  actions: [],
  ...over,
})

describe("student consultations", () => {
  it("requests a consultation", async () => {
    let body: unknown
    server.use(
      http.get(apiUrl("/v1/admission/consultations"), () => HttpResponse.json({ items: [] })),
      http.post(apiUrl("/v1/admission/consultations"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(consultation(), { status: 201 })
      }),
    )
    const error = spyOn(toast, "error").mockImplementation(() => "")
    renderAdmissionApp(<ConsultationsPage />)
    fireEvent.click((await screen.findAllByRole("button", { name: "Request a consultation" }))[0]!)
    fireEvent.change(await screen.findByLabelText("What do you need help with?"), { target: { value: "Essay review" } })
    fireEvent.click(screen.getByRole("button", { name: "Send request" }))
    await waitFor(() => expect(body).toMatchObject({ with_kind: "counselor", format: "online", topic: "Essay review" }))
  })

  it("cancels and confirms through the allowed actions", async () => {
    const posted: string[] = []
    server.use(
      http.get(apiUrl("/v1/admission/consultations"), () =>
        HttpResponse.json({
          items: [
            consultation({ id: "c1", actions: ["cancel"] }),
            consultation({ id: "c2", topic: "Proposed", status: "proposed", actions: ["confirm"] }),
          ],
        }),
      ),
      http.post(apiUrl("/v1/admission/consultations/:id/:action"), ({ params }) => {
        posted.push(`${params.id}/${params.action}`)
        return HttpResponse.json(consultation())
      }),
    )
    renderAdmissionApp(<ConsultationsPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(posted).toEqual([])
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(posted).toEqual(["c1/cancel"]))
    fireEvent.click(await screen.findByRole("button", { name: "Confirm time" }))
    await waitFor(() => expect(posted).toEqual(["c1/cancel", "c2/confirm"]))
  })
})

describe("staff consultation queue", () => {
  it("confirms a request with a slot", async () => {
    let path = ""
    let body: unknown
    server.use(
      http.get(apiUrl("/v1/admission/consultations/queue"), () =>
        HttpResponse.json({ items: [consultation({ viewer: "staff", actions: ["accept", "decline"] })] }),
      ),
      http.post(apiUrl("/v1/admission/consultations/:id/:action"), async ({ params, request }) => {
        path = `${params.id}/${params.action}`
        body = await request.json()
        return HttpResponse.json(consultation({ status: "accepted" }))
      }),
    )
    renderAdmissionApp(<StaffConsultationsPage />, counselor)
    fireEvent.click(await screen.findByRole("button", { name: "Confirm" }))
    fireEvent.change(await screen.findByLabelText("Location or link"), { target: { value: "Room 4" } })
    fireEvent.click(screen.getAllByRole("button", { name: "Confirm" }).at(-1)!)
    await waitFor(() => expect(path).toBe("c1/accept"))
    expect(body).toMatchObject({ location: "Room 4" })
  })
})

describe("consultation details", () => {
  const when = "2026-12-01T09:30:00Z"

  it("shows the student, the preferred times and prefills the proposal from them", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/consultations/queue"), () =>
        HttpResponse.json({
          items: [
            consultation({
              viewer: "staff",
              student_name: "Karimov Ali",
              preferred_times: [when],
              actions: ["propose"],
            }),
          ],
        }),
      ),
    )
    renderAdmissionApp(<StaffConsultationsPage />, counselor)
    expect(await screen.findByText(/Karimov Ali/)).toBeTruthy()
    expect(screen.getByText(/Preferred times:/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Propose a time" }))
    const input = (await screen.findByLabelText("Time")) as HTMLInputElement
    expect(input.value).toBe(toLocalInput(when))
    expect(input.value).not.toBe("")
  })

  it("explains the limit of open consultations", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/consultations"), () => HttpResponse.json({ items: [] })),
      http.post(apiUrl("/v1/admission/consultations"), () =>
        HttpResponse.json(
          { type: "admission/item_limit", title: "Limit", status: 422, params: { kind: "consultation", limit: 3 } },
          { status: 422, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    renderAdmissionApp(<ConsultationsPage />)
    fireEvent.click((await screen.findAllByRole("button", { name: "Request a consultation" }))[0]!)
    fireEvent.change(await screen.findByLabelText("What do you need help with?"), { target: { value: "Four" } })
    fireEvent.click(screen.getByRole("button", { name: "Send request" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("You can have up to 3 open consultations")
  })
})

describe("document process", () => {
  it("lists the steps with their status", async () => {
    server.use(
      http.get(apiUrl("/v1/admission/document-process"), () =>
        HttpResponse.json({
          steps: [
            {
              key: "transcript",
              title: "Request the transcript",
              issuer: "Registrar",
              description: "Ask the office.",
              lead_days_min: 3,
              lead_days_max: 5,
              status: "not_started",
            },
          ],
        }),
      ),
    )
    renderAdmissionApp(<DocumentProcess />)
    expect(await screen.findByText("Request the transcript")).toBeTruthy()
  })
})

describe("proof urls", () => {
  it("accepts public https and refuses the rest", () => {
    expect(validateProofUrl("https://example.com/a")).toBeNull()
    expect(validateProofUrl("http://example.com")).toBe("scheme")
    expect(validateProofUrl("")).toBe("empty")
  })
})

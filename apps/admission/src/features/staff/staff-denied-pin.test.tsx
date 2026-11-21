import { apiUrl, server } from "@ihsp/test-utils"
import { screen } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { describe, expect, test } from "bun:test"
import { renderAdmissionApp } from "../../tests/helpers"
import { StaffReviewTab } from "../app-review/components/staff-review-tab"
import { CommentsPanel } from "../comments/components/comments-panel"
import { PinCard } from "./components/pin-card"
import { WordsTab } from "./components/student-tabs"

const forbidden = () => HttpResponse.json({ code: "forbidden", message: "no" }, { status: 403 })

describe("denied sections", () => {
  test("a 403 on words reads 'not shared', never a connection error", async () => {
    server.use(http.get(apiUrl("/v1/admission/students/s1/words"), forbidden))
    renderAdmissionApp(<WordsTab studentId="s1" />)
    expect(await screen.findByText(/has not shared “Words”/)).toBeTruthy()
    expect(screen.queryByText(/went wrong|connection/i)).toBeNull()
  })

  test("a 403 on AI review reads 'not shared'", async () => {
    server.use(http.get(apiUrl("/v1/admission/students/s1/application-reviews"), forbidden))
    renderAdmissionApp(<StaffReviewTab studentId="s1" />)
    expect(await screen.findByText(/has not shared “AI review”/)).toBeTruthy()
  })

  test("a 403 on comments reads 'not shared'", async () => {
    server.use(http.get(apiUrl("/v1/admission/comments"), forbidden))
    renderAdmissionApp(<CommentsPanel target={{ studentId: "s1", kind: "words", id: "s1" }} />)
    expect(await screen.findByText(/has not shared “Comments”/)).toBeTruthy()
  })
})

describe("pin card", () => {
  const pinUrl = apiUrl("/v1/admission/staff/students/s1/pin")

  test("shows the current pin with its expiry", async () => {
    server.use(
      http.get(pinUrl, () =>
        HttpResponse.json({
          student_id: "s1",
          title: "Upload passport",
          href: "/documents/",
          note: null,
          pinned_by: "Demo Counselor",
          expires_at: "2030-01-15T00:00:00Z",
        }),
      ),
    )
    renderAdmissionApp(<PinCard studentId="s1" />)
    expect(await screen.findByText("Upload passport")).toBeTruthy()
    expect(screen.getByText(/Pinned by Demo Counselor/)).toBeTruthy()
    expect(screen.getByRole("button", { name: "Unpin" })).toBeTruthy()
  })

  test("a 404 means nothing is pinned, and pinning posts the form", async () => {
    server.use(http.get(pinUrl, () => HttpResponse.json({ code: "not_found" }, { status: 404 })))
    let body: unknown = null
    server.use(
      http.post(pinUrl, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({}, { status: 200 })
      }),
    )
    const { user } = renderAdmissionApp(<PinCard studentId="s1" />)
    expect(await screen.findByText("Nothing is pinned")).toBeTruthy()
    await user.type(screen.getByLabelText("What to do"), "Send transcript")
    await user.click(screen.getByRole("button", { name: "Pin" }))
    await screen.findByText("Nothing is pinned")
    expect(body).toEqual({ title: "Send transcript", href: null, note: null })
  })
})

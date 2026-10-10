import { describe, expect, it } from "bun:test"
import { apiUrl, renderWithProviders, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { MailPage } from "./mail-page"

function sentMail(index: number) {
  return {
    id: `00000000-0000-4000-8000-0000000003${String(index).padStart(2, "0")}`,
    to: ["teacher@example.org"],
    subject: `Question ${index}`,
    snippet: "Hello",
    sent_at: `2026-10-0${index + 1}T08:00:00Z`,
    status: "sent",
    attachment_name: index === 0 ? "notes.pdf" : null,
  }
}

describe("MailPage", () => {
  it("shows the compose form and the emails I sent, with an attachment name", async () => {
    server.use(
      http.get(apiUrl("/v1/me/outbound-mail"), () =>
        HttpResponse.json({ items: [sentMail(0), sentMail(1)], next_before: null }),
      ),
    )
    renderWithProviders(<MailPage />, {})

    expect(await screen.findByText("Question 0")).toBeInTheDocument()
    expect(screen.getByText("Question 1")).toBeInTheDocument()
    expect(screen.getByText("notes.pdf")).toBeInTheDocument()
    expect(screen.getByLabelText("To")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
  })

  it("says so when nothing was sent yet, and pages on with Show more", async () => {
    server.use(
      http.get(apiUrl("/v1/me/outbound-mail"), ({ request }) => {
        const before = new URL(request.url).searchParams.get("before")
        return before
          ? HttpResponse.json({ items: [sentMail(2)], next_before: null })
          : HttpResponse.json({ items: [sentMail(1)], next_before: "2026-10-02T08:00:00Z" })
      }),
    )
    renderWithProviders(<MailPage />, {})
    await screen.findByText("Question 1")

    fireEvent.click(screen.getByRole("button", { name: "Show more" }))

    expect(await screen.findByText("Question 2")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument()
  })

  it("an empty list shows the empty text; a sent email is posted and the list refreshes", async () => {
    let calls = 0
    let posted: unknown = null
    server.use(
      http.get(apiUrl("/v1/me/outbound-mail"), () => {
        calls += 1
        return HttpResponse.json({ items: calls > 1 ? [sentMail(3)] : [], next_before: null })
      }),
      http.post(apiUrl("/v1/me/outbound-mail"), async ({ request }) => {
        posted = await request.json()
        return HttpResponse.json({ message_id: "<1@ihsu.uz>", to: ["teacher@example.org"], attachment_name: null })
      }),
    )
    renderWithProviders(<MailPage />, {})
    expect(await screen.findByText("You have not sent any emails yet.")).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("To"), { target: { value: "teacher@example.org" } })
    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "Question 3" } })
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "Hello" } })
    fireEvent.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(posted).toMatchObject({ to: ["teacher@example.org"], subject: "Question 3" }))
    expect(await screen.findByText("Question 3", { selector: "span" })).toBeInTheDocument()
  })
})

import { describe, expect, it } from "bun:test"
import { apiUrl, problem, renderWithProviders, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { ComposeMailDialog, parseRecipients } from "./compose-mail-dialog"

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe("parseRecipients", () => {
  it("splits on commas, semicolons and spaces", () => {
    expect(parseRecipients(" a@x.org, b@y.org;c@z.org ")).toEqual(["a@x.org", "b@y.org", "c@z.org"])
    expect(parseRecipients("  ")).toEqual([])
  })
})

describe("ComposeMailDialog", () => {
  it("keeps Send off until there are a recipient, a subject and a message, then posts them", async () => {
    let sent: unknown = null
    server.use(
      http.post(apiUrl("/v1/me/outbound-mail"), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ message_id: "<1@ihsu.uz>", to: ["teacher@example.org"], attachment_name: null })
      }),
    )
    renderWithProviders(<ComposeMailDialog open onOpenChange={() => {}} />, {})
    const send = await screen.findByRole("button", { name: "Send" })
    expect(send).toBeDisabled()

    fill("To", "teacher@example.org")
    fill("Subject", "Question")
    fill("Message", "Hello")
    expect(send).toBeEnabled()
    fireEvent.click(send)

    await waitFor(() =>
      expect(sent).toEqual({ to: ["teacher@example.org"], subject: "Question", body: "Hello", attachment_file_id: null }),
    )
  })

  it("starts with the given recipient and shows the server's error", async () => {
    server.use(
      http.post(apiUrl("/v1/me/outbound-mail"), () =>
        problem(429, "mail/daily-limit", "Limit", { params: { limit: 20 } }),
      ),
    )
    renderWithProviders(<ComposeMailDialog open onOpenChange={() => {}} initialTo={["anna@example.org"]} />, {})
    expect(await screen.findByLabelText("To")).toHaveValue("anna@example.org")

    fill("Subject", "Hi")
    fill("Message", "Text")
    fireEvent.click(screen.getByRole("button", { name: "Send" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("20")
  })
})

/** CARD-2: the QR shows the permanent token; "Regenerate code" replaces it after a confirmation. */
import { beforeEach, describe, expect, test } from "bun:test"
import { apiUrl, resetStudentCardTokens, server, studentCardToken } from "@ihsp/test-utils"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { HttpResponse, http } from "msw"
import { act, screen, waitFor } from "@testing-library/react"
import { useState } from "react"
import en from "../../messages/en.json"
import cardEn from "../../messages/en/student-card.json"
import { StudentCardSheet } from "../features/student-card/components/student-card-sheet"
import { cardUrl } from "../features/student-card/utils/card-url"
import { configureTests, renderSp } from "./helpers"

configureTests()
const messages = mergeMessages(en as Messages, cardEn as Messages)

let tokenRequests = 0
beforeEach(() => {
  tokenRequests = 0
  resetStudentCardTokens()
  server.use(
    http.post(apiUrl("/v1/me/student-card/tokens"), () => {
      tokenRequests += 1
      return HttpResponse.json(studentCardToken(tokenRequests))
    }),
  )
})

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>open card</button>
      <StudentCardSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

const qrUrl = () => screen.findByTestId("card-qr").then((node) => node.getAttribute("data-card-url"))

describe("CARD-2: the QR token", () => {
  test("the permanent token is shown as is; opening the card issues no token", async () => {
    renderSp(<Harness />, { messages })
    await act(async () => (await screen.findByText("open card")).click())

    expect(await qrUrl()).toBe(cardUrl("http://localhost:3006", "my-card-token-0"))
    expect(screen.queryByRole("timer")).not.toBeInTheDocument()
    expect(tokenRequests).toBe(0)
  })

  test("regenerating asks first, then shows the new token", async () => {
    renderSp(<Harness />, { messages })
    await act(async () => (await screen.findByText("open card")).click())
    await qrUrl()

    await act(async () => screen.getByRole("button", { name: "Regenerate code" }).click())
    expect(await screen.findByText(/The old one stops working at once/)).toBeInTheDocument()
    expect(tokenRequests).toBe(0)

    await act(async () => screen.getByRole("button", { name: "Regenerate" }).click())
    await waitFor(async () => expect(await qrUrl()).toBe(cardUrl("http://localhost:3006", "my-card-token-1")))
    expect(tokenRequests).toBe(1)
  })

  test("cancelling the confirmation keeps the token", async () => {
    renderSp(<Harness />, { messages })
    await act(async () => (await screen.findByText("open card")).click())
    await qrUrl()

    await act(async () => screen.getByRole("button", { name: "Regenerate code" }).click())
    await act(async () => (await screen.findByRole("button", { name: /cancel/i })).click())
    expect(await qrUrl()).toBe(cardUrl("http://localhost:3006", "my-card-token-0"))
    expect(tokenRequests).toBe(0)
  })
})

/** CARD-2: the student-card QR token is issued on every open and renewed while open. */
import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test"
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
afterEach(() => jest.useRealTimers())

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
  test("a new token on each open, renewed after refresh_in, stopped on close", async () => {
    jest.useFakeTimers({ doNotFake: ["setImmediate", "nextTick", "queueMicrotask"] } as Parameters<
      typeof jest.useFakeTimers
    >[0])
    renderSp(<Harness />, { messages })

    await act(async () => (await screen.findByText("open card")).click())
    await waitFor(async () => expect(await qrUrl()).toBe(cardUrl("http://localhost:3006", "my-card-token-1")))
    expect(screen.getByRole("timer")).toHaveTextContent("New code in 60 s")

    act(() => jest.advanceTimersByTime(10_000))
    expect(screen.getByRole("timer")).toHaveTextContent("New code in 50 s")

    act(() => jest.advanceTimersByTime(50_000))
    await waitFor(async () => expect(await qrUrl()).toBe(cardUrl("http://localhost:3006", "my-card-token-2")))
    expect(tokenRequests).toBe(2)

    await act(async () => (await screen.findByRole("button", { name: /close/i })).click())
    act(() => jest.advanceTimersByTime(120_000))
    expect(tokenRequests).toBe(2)

    await act(async () => screen.getByText("open card").click())
    await waitFor(() => expect(tokenRequests).toBe(3))
  })
})

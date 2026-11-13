/** ID-HEADER: the dashboard shows who is signed in, opens the card, and compacts on scroll. */
import { describe, expect, test } from "bun:test"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { act, fireEvent, screen } from "@testing-library/react"
import en from "../../messages/en.json"
import cardEn from "../../messages/en/student-card.json"
import { IdentityHeader } from "../features/today/dashboard/identity-header"
import { configureTests, renderSp } from "./helpers"

configureTests()
const messages = mergeMessages(en as Messages, cardEn as Messages)

describe("ID-HEADER identity header", () => {
  test("shows name and group, opens the card sheet", async () => {
    renderSp(<IdentityHeader />, { messages })
    const header = await screen.findByTestId("identity-header")
    expect(header).toHaveAttribute("data-compact", "false")
    expect(header.textContent).toMatch(/course/)
    fireEvent.click(screen.getByRole("button", { name: /student card/i }))
    expect(await screen.findByTestId("card-qr")).toBeTruthy()
  })

  test("collapses once the page is scrolled", async () => {
    renderSp(<IdentityHeader />, { messages })
    const header = await screen.findByTestId("identity-header")
    act(() => {
      Object.defineProperty(window, "scrollY", { value: 200, configurable: true })
      window.dispatchEvent(new Event("scroll"))
    })
    expect(header).toHaveAttribute("data-compact", "true")
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true })
  })
})

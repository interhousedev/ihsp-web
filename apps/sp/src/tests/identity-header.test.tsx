/** ID-HEADER: the dashboard shows who is signed in, opens the card, and compacts on scroll. */
import { describe, expect, test } from "bun:test"
import { apiUrl, server, studentCard } from "@ihsp/test-utils"
import { HttpResponse, http } from "msw"
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

  test("a null group and course leave no line and no stray separator", async () => {
    server.use(
      http.get(apiUrl("/v1/me/student-card"), () => HttpResponse.json(studentCard({ group: null, course: null }))),
    )
    renderSp(<IdentityHeader />, { messages })
    const header = await screen.findByTestId("identity-header")
    await screen.findByText(/Aleksey/)
    expect(header.querySelectorAll("p")).toHaveLength(1)
  })

  test("only a group shows without the course", async () => {
    server.use(http.get(apiUrl("/v1/me/student-card"), () => HttpResponse.json(studentCard({ course: null }))))
    renderSp(<IdentityHeader />, { messages })
    const header = await screen.findByTestId("identity-header")
    await screen.findByText("11-A")
    expect(header.textContent).not.toMatch(/course|·/)
  })

  test("a failed card load falls back to the session name and keeps the button", async () => {
    server.use(http.get(apiUrl("/v1/me/student-card"), () => HttpResponse.json({ title: "x" }, { status: 500 })))
    renderSp(<IdentityHeader />, { messages })
    expect(await screen.findByText(/Aleksey/)).toBeTruthy()
    expect(screen.getByRole("button", { name: /student card/i })).toBeTruthy()
  })
})

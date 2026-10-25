/** Security contact button of the auth layout: parsing rules and rendering as text. */
import { afterEach, describe, expect, test } from "bun:test"
import { TEST_ENV } from "@ihsp/test-utils"
import { resetConfig } from "@ihsp/config"
import { screen, waitFor, within } from "@testing-library/react"
import { FlowShell } from "../features/shared/components/flow-shell"
import { parseSecurityContact } from "../features/shared/utils/security-contact"
import { clickButton, renderId, allowSlowTests } from "./helpers"

allowSlowTests()

function setContact(value: string | undefined) {
  window.__ENV__ =
    value === undefined ? { ...TEST_ENV, SECURITY_CONTACT: undefined } : { ...TEST_ENV, SECURITY_CONTACT: value }
  resetConfig()
}

afterEach(() => {
  setContact(undefined)
})

describe("parseSecurityContact", () => {
  test("links a strict email and a strict Telegram handle and keeps the rest as text", () => {
    expect(parseSecurityContact("alex@sayfi.uz, @megaplov (Telegram)")).toEqual([
      { kind: "email", text: "alex@sayfi.uz", href: "mailto:alex@sayfi.uz" },
      { kind: "text", text: ", " },
      { kind: "telegram", text: "@megaplov", href: "https://t.me/megaplov" },
      { kind: "text", text: " (Telegram)" },
    ])
  })

  test("does not turn the domain of an email into a Telegram handle", () => {
    const parts = parseSecurityContact("help@example.org")

    expect(parts).toEqual([{ kind: "email", text: "help@example.org", href: "mailto:help@example.org" }])
  })

  test("leaves text that is not a strict email or handle as plain text", () => {
    expect(parseSecurityContact("user@host @ab @bad_ 5@x")).toEqual([{ kind: "text", text: "user@host @ab @bad_ 5@x" }])
  })

  test("keeps markup as text, never as elements", () => {
    const parts = parseSecurityContact("<img src=x onerror=alert(1)> a@b.co")

    expect(parts.map((part) => part.kind)).toEqual(["text", "email"])
    expect(parts[0]).toEqual({ kind: "text", text: "<img src=x onerror=alert(1)> " })
  })
})

describe("security contact button in the auth layout", () => {
  test("opens a dialog that shows the contact with a mailto and a Telegram link", async () => {
    setContact("alex@sayfi.uz, @megaplov (Telegram)")
    renderId(<FlowShell>x</FlowShell>)

    await clickButton("Security contact")
    const dialog = await screen.findByRole("dialog", { hidden: true })

    expect(within(dialog).getByRole("link", { name: "alex@sayfi.uz", hidden: true })).toHaveAttribute(
      "href",
      "mailto:alex@sayfi.uz",
    )
    expect(within(dialog).getByRole("link", { name: "@megaplov", hidden: true })).toHaveAttribute(
      "href",
      "https://t.me/megaplov",
    )
  })

  test("renders a hostile contact as text inside the dialog", async () => {
    setContact("<b>bold</b> a@b.co")
    renderId(<FlowShell>x</FlowShell>)

    await clickButton("Security contact")
    const dialog = await screen.findByRole("dialog", { hidden: true })

    expect(dialog.querySelector("b")).toBeNull()
    expect(within(dialog).getByText(/<b>bold<\/b>/)).toBeInTheDocument()
  })

  test("hides the button when the contact is unset", async () => {
    setContact(undefined)
    renderId(<FlowShell>x</FlowShell>)

    await waitFor(() => expect(screen.getByText("IHT ID")).toBeInTheDocument())
    expect(screen.queryByRole("button", { name: "Security contact", hidden: true })).toBeNull()
  })

  test("hides the button when the contact is empty", async () => {
    setContact("")
    renderId(<FlowShell>x</FlowShell>)

    await waitFor(() => expect(screen.getByText("IHT ID")).toBeInTheDocument())
    expect(screen.queryByRole("button", { name: "Security contact", hidden: true })).toBeNull()
  })
})

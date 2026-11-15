import { afterEach, describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { act, screen } from "@testing-library/react"
import { closeConnectAi } from "./connect-ai-store"
import { ConnectAiDialogHost } from "./connect-ai-dialog"
import { ConnectAiLink } from "./connect-ai-link"

afterEach(() => act(() => closeConnectAi()))

describe("ConnectAiLink with a dialog host", () => {
  it("opens the wizard in a dialog without navigating", async () => {
    const { user } = renderWithProviders(
      <>
        <ConnectAiLink href="http://id.test/connectors/new/">Connect my AI</ConnectAiLink>
        <ConnectAiDialogHost />
      </>,
    )
    const before = window.location.href

    await user.click(await screen.findByRole("button", { name: "Connect my AI" }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(window.location.href).toBe(before)
  })

  it("is a plain link without a host", async () => {
    renderWithProviders(<ConnectAiLink href="http://id.test/connectors/new/">Connect my AI</ConnectAiLink>)

    expect(await screen.findByRole("link", { name: "Connect my AI" })).toHaveAttribute(
      "href",
      "http://id.test/connectors/new/",
    )
  })
})

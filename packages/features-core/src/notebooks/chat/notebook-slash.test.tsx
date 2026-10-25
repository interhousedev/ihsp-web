import { describe, expect, it } from "bun:test"
import { notebookTurn, server } from "@ihsp/test-utils"
import { screen, waitFor } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders } from "../test-support"
import { chatUrl, messageField, renderChat } from "./chat-test-support"

allowSlowRenders()

describe("NotebookComposer: slash commands", () => {
  it("opens the command menu on / and narrows it as you type", async () => {
    const { user } = await renderChat()
    await user.click(messageField())

    await user.keyboard("/")
    expect(await screen.findAllByRole("option")).toHaveLength(11)

    await user.keyboard("qu")
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent("/quiz")
  })

  it("picks with the arrows and Enter, shows the chip and removes it with Backspace", async () => {
    const { user } = await renderChat()
    await user.click(messageField())

    await user.keyboard("/{ArrowDown}{Enter}")

    expect(document.querySelector('[data-slash-chip="cards"]')).not.toBeNull()
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    await user.keyboard("{Backspace}")
    expect(document.querySelector("[data-slash-chip]")).toBeNull()
  })

  it("sends the command and its arguments to the server instead of a long prompt", async () => {
    let body: unknown
    server.use(
      http.post(chatUrl("/messages"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(notebookTurn("Done"))
      }),
    )
    const { user } = await renderChat()
    await user.click(messageField())

    await user.keyboard("/summary{Enter}")
    await user.paste("photosynthesis")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(body).toMatchObject({ command: "summary", args: "photosynthesis", text: "" }))
  })
})

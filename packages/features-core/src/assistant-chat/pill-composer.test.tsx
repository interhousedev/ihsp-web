import { describe, expect, it, mock, spyOn } from "bun:test"
import type { FileItem } from "@ihsp/api"
import {
  apiUrl,
  currentWebQuota,
  nbIds,
  server,
  setWebQuota,
  testRouter,
  webQuotaDisabled,
  webQuotaSpent,
} from "@ihsp/test-utils"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../notebooks/test-support"
import type { LimitState } from "./limit-info"
import {
  notebookDraftKey,
  PillComposer,
  type PillComposerHandle,
  type PillComposerProps,
  type PillSendOptions,
} from "./pill-composer"
import { webSwitchKey } from "./use-web-switch"

allowSlowRenders()

/** Base UI keeps `pointer-events: none` on the parent of an open sub-menu; real pointers are not blocked by it. */
const loose = userEvent.setup({ pointerEventsCheck: 0 })

type Props = Partial<PillComposerProps>

function renderComposer(props: Props = {}) {
  const onSend = mock(async (_text: string, _files: FileItem[], _options?: PillSendOptions) => true)
  const limit: LimitState = { reached: false }
  const result = renderNotebook(
    <PillComposer sending={false} limit={limit} onSend={onSend} placeholder="Ask the assistant" {...props} />,
    { route: "/assistant/" },
  )
  return { ...result, onSend }
}

async function typeInto(user: ReturnType<typeof renderComposer>["user"], text: string) {
  await user.click(screen.getByRole("textbox", { name: "Message" }))
  await user.paste(text)
}

describe("PillComposer: sending", () => {
  it("sends on Enter and clears the field; Shift+Enter adds a line instead", async () => {
    const { user, onSend } = renderComposer()
    const field = screen.getByRole("textbox", { name: "Message" })

    await typeInto(user, "first line")
    await user.keyboard("{Shift>}{Enter}{/Shift}")
    await user.paste("second line")
    expect(field).toHaveValue("first line\nsecond line")
    expect(onSend).not.toHaveBeenCalled()

    await user.keyboard("{Enter}")

    await waitFor(() => expect(onSend).toHaveBeenCalledWith("first line\nsecond line", []))
    await waitFor(() => expect(field).toHaveValue(""))
  })

  it("has a placeholder, a disclaimer and a disabled send button while empty", () => {
    renderComposer()

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("placeholder", "Ask the assistant")
    expect(screen.getByText(/The assistant is AI and can make mistakes/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute("data-assistant-composer")
  })

  it("does not send an empty or blank message", async () => {
    const { user, onSend } = renderComposer()

    await typeInto(user, "   ")
    await user.keyboard("{Enter}")

    expect(onSend).not.toHaveBeenCalled()
  })

  it("brings the draft back when the message was not sent", async () => {
    const onSend = mock(async (_text: string, _files: FileItem[]) => false)
    const { user } = renderComposer({ onSend })

    await typeInto(user, "Please try again")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Please try again"))
  })

  it("keeps Enter as a new line on touch devices", async () => {
    const matchMedia = spyOn(window, "matchMedia").mockImplementation(
      (query: string) => ({ matches: query === "(pointer: coarse)", media: query }) as MediaQueryList,
    )
    const { user, onSend } = renderComposer()

    await typeInto(user, "touch")
    await user.keyboard("{Enter}")

    expect(onSend).not.toHaveBeenCalled()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("touch\n")
    matchMedia.mockRestore()
  })

  it("shows Stop instead of Send while a turn runs, when the page can stop it", async () => {
    const onStop = mock(() => undefined)
    const { user } = renderComposer({ sending: true, onStop })

    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Stop" }))

    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it("keeps a disabled Send while a turn runs and nothing can stop it", () => {
    renderComposer({ sending: true })

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument()
  })

  it("fills the field from a suggestion and focuses it", async () => {
    const view = renderComposer({ prefill: { key: 1, text: "Plan my study week" } })

    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Plan my study week")
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus()

    view.rerender(
      <PillComposer
        sending={false}
        limit={{ reached: false }}
        onSend={async () => true}
        placeholder="Ask"
        prefill={{ key: 2, text: "What is due tomorrow?" }}
      />,
    )
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("What is due tomorrow?"))
  })
})

describe("PillComposer: limit, offline and tier", () => {
  it("is disabled at the limit and tells when it resets", () => {
    renderComposer({ limit: { reached: true, scope: "day", resetsAt: "2026-10-08T00:00:00Z" } })

    expect(screen.getByText("Daily limit reached, resets at 05:00")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled()
  })

  it("keeps the tier picker out of the composer (it lives in the page header)", () => {
    renderComposer()

    expect(screen.queryByRole("button", { name: /Answer mode/ })).not.toBeInTheDocument()
  })
})

describe("PillComposer: layout", () => {
  it("stacks the toolbar under the field on phones and puts send after the field in DOM order", () => {
    renderComposer()
    const field = screen.getByRole("textbox", { name: "Message" })
    const send = screen.getByRole("button", { name: "Send" })
    const row = field.parentElement as HTMLElement

    expect(row).toHaveClass("flex-col", "sm:flex-row")
    expect(field).toHaveClass("w-full", "order-1", "sm:order-2")
    expect(field).toHaveClass("max-h-40", "field-sizing-content")
    expect(send.closest("form")).toBe(field.closest("form"))
    expect(send.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
    expect(send.closest("form")?.className).toContain("env(safe-area-inset-bottom)")
  })
})

describe("PillComposer: the + menu", () => {
  it("attaches files from My files and hands them to onSend", async () => {
    const { user, onSend } = renderComposer()

    await user.click(screen.getByRole("button", { name: "Add" }))
    await user.click(await screen.findByRole("menuitem", { name: "From My files" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(await within(dialog).findByLabelText(/kinematics-notes\.pdf/))
    await user.click(within(dialog).getByRole("button", { name: "Attach 1 file" }))
    expect(await screen.findByRole("button", { name: "kinematics-notes.pdf" })).toBeInTheDocument()
    await typeInto(user, "Summarize this")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1))
    expect(onSend.mock.calls[0]?.[0]).toBe("Summarize this")
    expect(onSend.mock.calls[0]?.[1].map((file) => file.name)).toEqual(["kinematics-notes.pdf"])
  })

  it("opens the file chooser from Upload a file and attaches the uploaded file", async () => {
    const { user, onSend } = renderComposer()
    const input = screen.getByTestId("file-upload-input")
    const click = spyOn(input, "click")

    await user.click(screen.getByRole("button", { name: "Add" }))
    await user.click(await screen.findByRole("menuitem", { name: "Upload a file" }))
    expect(click).toHaveBeenCalledTimes(1)

    fireEvent.change(input, { target: { files: [new File(["hello"], "notes.pdf", { type: "application/pdf" })] } })
    expect(await screen.findByRole("button", { name: "notes.pdf" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Remove notes.pdf" }))
    expect(screen.queryByRole("button", { name: "notes.pdf" })).not.toBeInTheDocument()
    expect(onSend).not.toHaveBeenCalled()
  })

  it("prefixes the message with a hint line while Guided learning is on", async () => {
    const { user, onSend } = renderComposer()

    await user.click(screen.getByRole("button", { name: "Add" }))
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Guided learning" }))
    expect(await screen.findByRole("button", { name: "Turn off guided learning" })).toBeInTheDocument()
    await typeInto(user, "What is a vector?")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1))
    const text = onSend.mock.calls[0]?.[0] ?? ""
    expect(text.startsWith("Guided learning: explain step by step")).toBe(true)
    expect(text.endsWith("\n\nWhat is a vector?")).toBe(true)
  })

  it("sends the plain text after Guided learning was turned off", async () => {
    const { user, onSend } = renderComposer()

    await user.click(screen.getByRole("button", { name: "Add" }))
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Guided learning" }))
    await user.click(await screen.findByRole("button", { name: "Turn off guided learning" }))
    await typeInto(user, "What is a vector?")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(onSend).toHaveBeenCalledWith("What is a vector?", []))
  })

  it("opens a notebook's chat with the typed question as its draft", async () => {
    const { user } = renderComposer()
    await typeInto(user, "What is the Calvin cycle?")

    await user.click(screen.getByRole("button", { name: "Add" }))
    await user.click(await screen.findByRole("menuitem", { name: "Ask a notebook" }))
    await loose.click(await screen.findByRole("menuitem", { name: /Photosynthesis/ }))

    expect(window.sessionStorage.getItem(notebookDraftKey(nbIds.notebook))).toBe("What is the Calvin cycle?")
    expect(testRouter.push).toHaveBeenCalledWith(`/notebooks/view/?id=${nbIds.notebook}&tab=chat`)
  })
})

/** Counts the quota requests and waits for the first answer, so "not shown" is not just "not loaded yet". */
async function quotaLoaded() {
  let served = 0
  server.use(
    http.get(apiUrl("/v1/ai/web-search"), () => {
      served += 1
      return HttpResponse.json(currentWebQuota())
    }),
  )
  return async () => {
    await waitFor(() => expect(served).toBeGreaterThan(0))
    await new Promise((resolve) => setTimeout(resolve, 30))
  }
}

async function openMenu(user: ReturnType<typeof renderComposer>["user"]) {
  await user.click(screen.getByRole("button", { name: "Add" }))
  return screen.findByRole("menuitemcheckbox", { name: "Guided learning" })
}

describe("PillComposer: web search switch", () => {
  it("lists Web search under a Tools label with the searches left, off by default", async () => {
    const { user } = renderComposer()

    await openMenu(user)

    const item = await screen.findByRole("menuitemcheckbox", { name: /Web search/ })
    expect(item).toHaveAttribute("aria-checked", "false")
    expect(item).toHaveTextContent("4 left")
    expect(screen.getByText("Tools")).toBeInTheDocument()
    expect(screen.getByRole("menuitemcheckbox", { name: "Guided learning" })).toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
  })

  it("does not list Web search when the server has it turned off", async () => {
    setWebQuota(webQuotaDisabled)
    const waitForQuota = await quotaLoaded()
    const { user } = renderComposer()
    await waitForQuota()

    await openMenu(user)

    expect(screen.queryByRole("menuitemcheckbox", { name: /Web search/ })).not.toBeInTheDocument()
  })

  it("disables Web search at 0 left and says so", async () => {
    setWebQuota(webQuotaSpent)
    const { user } = renderComposer()

    await openMenu(user)

    const item = await screen.findByRole("menuitemcheckbox", { name: /Web search/ })
    expect(item).toHaveAttribute("aria-disabled", "true")
    expect(item).toHaveTextContent("0 left")
    await user.click(item)
    expect(screen.queryByRole("button", { name: "Turn off web search" })).not.toBeInTheDocument()
  })

  it("shows a removable Web chip and the quota line while the switch is on", async () => {
    const { user } = renderComposer()

    await openMenu(user)
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /Web search/ }))

    const chips = await screen.findByRole("group", { name: "Attached files" })
    expect(within(chips).getByText("Web")).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("4 of 10 web searches left today")

    await user.click(within(chips).getByRole("button", { name: "Turn off web search" }))

    expect(screen.queryByRole("button", { name: "Turn off web search" })).not.toBeInTheDocument()
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(window.sessionStorage.getItem(webSwitchKey())).toBeNull()
  })

  it("tells when the searches of today are spent and when they come back", async () => {
    window.sessionStorage.setItem(webSwitchKey(), "1")
    setWebQuota(webQuotaSpent)
    renderComposer()

    expect(await screen.findByRole("status")).toHaveTextContent("No web searches left today. Resets at 05:00.")
  })

  it("passes webSearch to onSend only while the switch is on", async () => {
    const { user, onSend } = renderComposer()

    await openMenu(user)
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /Web search/ }))
    await typeInto(user, "Who won the 2022 World Cup?")
    await user.click(screen.getByRole("button", { name: "Send" }))

    await waitFor(() => expect(onSend).toHaveBeenCalledTimes(1))
    expect(onSend).toHaveBeenCalledWith("Who won the 2022 World Cup?", [], { webSearch: true })
  })

  it("remembers the switch for the same chat after a reload, not for another chat", async () => {
    const first = renderComposer({ chatId: "chat-a" })
    await openMenu(first.user)
    await first.user.click(await screen.findByRole("menuitemcheckbox", { name: /Web search/ }))
    expect(await screen.findByRole("button", { name: "Turn off web search" })).toBeInTheDocument()
    expect(window.sessionStorage.getItem(webSwitchKey("chat-a"))).toBe("1")
    expect(window.sessionStorage.getItem("ihsp.assistant.web.chat-a")).toBe("1")
    first.unmount()

    const same = renderComposer({ chatId: "chat-a" })
    expect(await screen.findByRole("button", { name: "Turn off web search" })).toBeInTheDocument()
    same.unmount()

    const other = renderComposer({ chatId: "chat-b" })
    await openMenu(other.user)
    expect(await screen.findByRole("menuitemcheckbox", { name: /Web search/ })).toHaveAttribute("aria-checked", "false")
    expect(screen.queryByRole("button", { name: "Turn off web search" })).not.toBeInTheDocument()
  })

  it("follows the chat when the same composer shows another chat", async () => {
    window.sessionStorage.setItem(webSwitchKey("chat-a"), "1")
    const view = renderComposer({ chatId: "chat-a" })
    expect(await screen.findByRole("button", { name: "Turn off web search" })).toBeInTheDocument()

    view.rerender(
      <PillComposer
        sending={false}
        limit={{ reached: false }}
        onSend={async () => true}
        placeholder="Ask"
        chatId="chat-b"
      />,
    )

    await waitFor(() => expect(screen.queryByRole("button", { name: "Turn off web search" })).not.toBeInTheDocument())
  })

  it("keeps working when the browser blocks sessionStorage", async () => {
    const getItem = spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const setItem = spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { user } = renderComposer({ chatId: "chat-a" })

    await openMenu(user)
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /Web search/ }))

    expect(await screen.findByRole("button", { name: "Turn off web search" })).toBeInTheDocument()
    getItem.mockRestore()
    setItem.mockRestore()
  })

  it("lets the page turn the switch off after a web search failure", async () => {
    const ref = { current: null as PillComposerHandle | null }
    const { user } = renderComposer({ ref })
    await openMenu(user)
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /Web search/ }))
    expect(await screen.findByRole("button", { name: "Turn off web search" })).toBeInTheDocument()

    act(() => ref.current?.turnWebOff())

    await waitFor(() => expect(screen.queryByRole("button", { name: "Turn off web search" })).not.toBeInTheDocument())
    expect(window.sessionStorage.getItem(webSwitchKey())).toBeNull()
  })

  it("empties the field when the page sent the draft that came back, and keeps anything else", async () => {
    const ref = { current: null as PillComposerHandle | null }
    const onSend = mock(async (_text: string, _files: FileItem[], _options?: PillSendOptions) => false)
    const { user } = renderComposer({ ref, onSend })
    await typeInto(user, "Please try again")
    await user.click(screen.getByRole("button", { name: "Send" }))
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Please try again"))

    act(() => ref.current?.discardDraft("something else"))
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Please try again")

    act(() => ref.current?.discardDraft("Please try again"))
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue(""))
  })
})

describe("PillComposer: study tools and slash commands", () => {
  const TOOLS = [
    ["Flash cards", "cards"],
    ["Quiz", "quiz"],
    ["Explain", "explain"],
    ["Conspect", "summary"],
  ] as const

  it.each(TOOLS)("%s inserts its command chip and focuses the field", async (label, name) => {
    const { user } = renderComposer()

    await openMenu(user)
    await user.click(screen.getByRole("menuitem", { name: "Study tools" }))
    await loose.click(await screen.findByRole("menuitem", { name: label }))

    expect(document.querySelector(`[data-slash-chip="${name}"]`)).not.toBeNull()
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus())
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("")
  })

  it("sends the chip and the arguments as the short form with a command option", async () => {
    const { user, onSend } = renderComposer()
    await openMenu(user)
    await user.click(screen.getByRole("menuitem", { name: "Study tools" }))
    await loose.click(await screen.findByRole("menuitem", { name: "Explain" }))
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus())
    await user.keyboard("integrals{Enter}")

    await waitFor(() =>
      expect(onSend).toHaveBeenCalledWith("/explain integrals", [], {
        command: { name: "explain", args: "integrals" },
      }),
    )
  })

  it("opens the command menu on / and narrows it as you type", async () => {
    const { user } = renderComposer()
    await user.click(screen.getByRole("textbox", { name: "Message" }))

    await user.keyboard("/")
    expect(await screen.findAllByRole("option")).toHaveLength(11)

    await user.keyboard("ca")
    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(1)
    expect(options[0]).toHaveTextContent("/cards")
  })

  it("moves with the arrows, picks with Enter and removes the chip with Backspace", async () => {
    const { user, onSend } = renderComposer()
    await user.click(screen.getByRole("textbox", { name: "Message" }))

    await user.keyboard("/{ArrowDown}{Enter}")
    expect(document.querySelector('[data-slash-chip="cards"]')).not.toBeNull()
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(onSend).not.toHaveBeenCalled()

    await user.keyboard("{Backspace}")
    expect(document.querySelector("[data-slash-chip]")).toBeNull()
  })

  it("closes the menu with Escape and says so when nothing matches", async () => {
    const { user } = renderComposer()
    await user.click(screen.getByRole("textbox", { name: "Message" }))

    await user.keyboard("/xyz")
    expect(await screen.findByText("No such command")).toBeInTheDocument()

    await user.clear(screen.getByRole("textbox", { name: "Message" }))
    await user.keyboard("/{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("turns a typed /quiz followed by a space into the chip", async () => {
    const { user } = renderComposer()
    await user.click(screen.getByRole("textbox", { name: "Message" }))

    await user.keyboard("/quiz ")

    expect(document.querySelector('[data-slash-chip="quiz"]')).not.toBeNull()
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("")
  })
})

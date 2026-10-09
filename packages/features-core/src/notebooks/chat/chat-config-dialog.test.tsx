import { describe, expect, it, mock } from "bun:test"
import type { ChatConfig, NotebookDetail } from "@ihsp/api"
import type { Locale } from "@ihsp/i18n"
import { apiUrl, courseWorkspaceDetail, courseWorkspaceReadOnly, nbIds, notebookDetail, server } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { ChatConfigDialog } from "./chat-config-dialog"
import { renderChat } from "./chat-test-support"

allowSlowRenders()

const notebookUrl = apiUrl(`/v1/notebooks/${nbIds.notebook}`)

function renderDialog(
  config: ChatConfig = notebookDetail.chat_config,
  { notebook = notebookDetail, locale }: { notebook?: NotebookDetail; locale?: Locale } = {},
) {
  const onOpenChange = mock((_open: boolean) => undefined)
  const result = renderNotebook(
    <ChatConfigDialog notebook={{ ...notebook, chat_config: config }} open onOpenChange={onOpenChange} />,
    { locale },
  )
  return Object.assign(result, { onOpenChange })
}

const pressed = (name: string) => screen.getByRole("button", { name }).getAttribute("aria-pressed")

function capturePatch() {
  const captured: { body: unknown } = { body: undefined }
  server.use(
    http.patch(notebookUrl, async ({ request }) => {
      captured.body = await request.json()
      return HttpResponse.json(notebookDetail)
    }),
  )
  return captured
}

describe("ChatConfigDialog", () => {
  it("shows the current configuration", async () => {
    renderDialog({ style: "learning_guide", custom_prompt: null, length: "shorter", language: "ru" })

    expect(await screen.findByRole("dialog", { name: "Configure chat" })).toBeInTheDocument()
    expect(screen.getByRole("radio", { name: /Learning guide/ })).toBeChecked()
    expect(screen.getByRole("radio", { name: /Default/ })).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Shorter" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("combobox", { name: "Answer language" })).toHaveValue("ru")
    expect(screen.queryByRole("textbox", { name: "Style instruction" })).not.toBeInTheDocument()
  })

  it("saves the chosen style, length and language and closes", async () => {
    const patch = capturePatch()
    const { user, onOpenChange } = renderDialog()

    await user.click(await screen.findByRole("radio", { name: /Learning guide/ }))
    await user.click(screen.getByRole("button", { name: "Longer" }))
    await user.selectOptions(screen.getByRole("combobox", { name: "Answer language" }), "uz")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(patch.body).toEqual({
        chat_config: { style: "learning_guide", custom_prompt: null, length: "longer", language: "uz", goal: null },
      }),
    )
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("asks for a custom instruction of at most 1000 characters", async () => {
    const patch = capturePatch()
    const { user } = renderDialog()

    await user.click(await screen.findByRole("radio", { name: /Custom/ }))
    const field = screen.getByRole("textbox", { name: "Style instruction" })
    expect(field).toHaveAttribute("maxlength", "1000")
    expect(screen.getByText("0 of 1000")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled()

    await user.click(field)
    await user.paste("  Explain like I am 12  ")
    expect(screen.getByText("24 of 1000")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(patch.body).toEqual({
        chat_config: { style: "custom", custom_prompt: "Explain like I am 12", length: "default", language: "auto", goal: null },
      }),
    )
  })

  it("shows a failed save inline and stays open", async () => {
    server.use(
      http.patch(notebookUrl, () =>
        HttpResponse.json(
          { type: "notebooks/not-found", title: "Not found", status: 404 },
          { status: 404, headers: { "Content-Type": "application/problem+json" } },
        ),
      ),
    )
    const { user, onOpenChange } = renderDialog()

    await user.click(await screen.findByRole("radio", { name: /Learning guide/ }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("This notebook, source or item was not found.")
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("closes without a request on Cancel", async () => {
    const patch = capturePatch()
    const { user, onOpenChange } = renderDialog()

    await user.click(await screen.findByRole("button", { name: "Cancel" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(patch.body).toBeUndefined()
  })

  it("opens from the gear of the composer and saves the configuration of the notebook", async () => {
    const patch = capturePatch()
    const { user } = await renderChat()

    await user.click(screen.getByRole("button", { name: "Configure chat" }))
    await user.click(await screen.findByRole("radio", { name: /Learning guide/ }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(patch.body).toEqual({
        chat_config: { style: "learning_guide", custom_prompt: null, length: "default", language: "auto", goal: null },
      }),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})

const EXAM_PROMPT =
  "Answer like an examiner's checklist: the key facts and definitions first, then likely exam questions and common mistakes."
const SIMPLE_PROMPT =
  "Explain in plain, simple words with short sentences and everyday examples; avoid jargon, or explain it when unavoidable."
const DEPTH_PROMPT = "Give a thorough, detailed explanation with reasoning, edge cases and examples."

describe("ChatConfigDialog: presets", () => {
  it("shows five presets and presses the one the saved configuration matches", async () => {
    renderDialog()

    const group = await screen.findByRole("group", { name: "Presets" })
    expect(within(group).getAllByRole("button").map((button) => button.textContent)).toEqual([
      "Balanced",
      "Tutor",
      "Exam prep",
      "Simple words",
      "In depth",
    ])
    expect(pressed("Balanced")).toBe("true")
    expect(pressed("Tutor")).toBe("false")
  })

  it("presses no preset for a configuration that no preset makes", async () => {
    renderDialog({ style: "default", custom_prompt: null, length: "shorter", language: "ru" })

    await screen.findByRole("group", { name: "Presets" })
    for (const name of ["Balanced", "Tutor", "Exam prep", "Simple words", "In depth"]) expect(pressed(name)).toBe("false")
  })

  it("presses a preset that was saved earlier, whatever the language and goal are", async () => {
    renderDialog({ style: "learning_guide", custom_prompt: null, length: "default", language: "uz", goal: "Biology" })

    await screen.findByRole("group", { name: "Presets" })
    expect(pressed("Tutor")).toBe("true")
  })

  it("fills the style for Tutor and the style, text and length for the custom presets", async () => {
    const { user } = renderDialog()

    await user.click(await screen.findByRole("button", { name: "Tutor" }))
    expect(screen.getByRole("radio", { name: /Learning guide/ })).toBeChecked()
    expect(pressed("Tutor")).toBe("true")
    expect(pressed("Balanced")).toBe("false")

    await user.click(screen.getByRole("button", { name: "Exam prep" }))
    expect(screen.getByRole("radio", { name: /Custom/ })).toBeChecked()
    expect(screen.getByRole("textbox", { name: "Style instruction" })).toHaveValue(EXAM_PROMPT)
    expect(pressed("Default")).toBe("true")
    expect(pressed("Exam prep")).toBe("true")

    await user.click(screen.getByRole("button", { name: "Simple words" }))
    expect(screen.getByRole("textbox", { name: "Style instruction" })).toHaveValue(SIMPLE_PROMPT)
    expect(pressed("Shorter")).toBe("true")

    await user.click(screen.getByRole("button", { name: "In depth" }))
    expect(screen.getByRole("textbox", { name: "Style instruction" })).toHaveValue(DEPTH_PROMPT)
    expect(pressed("Longer")).toBe("true")

    await user.click(screen.getByRole("button", { name: "Balanced" }))
    expect(screen.getByRole("radio", { name: /Default/ })).toBeChecked()
    expect(screen.queryByRole("textbox", { name: "Style instruction" })).not.toBeInTheDocument()
    expect(pressed("Default")).toBe("true")
  })

  it("keeps the pressed preset when it is clicked again", async () => {
    const { user } = renderDialog()

    await user.click(await screen.findByRole("button", { name: "Exam prep" }))
    await user.click(screen.getByRole("button", { name: "Exam prep" }))

    expect(pressed("Exam prep")).toBe("true")
    expect(screen.getByRole("textbox", { name: "Style instruction" })).toHaveValue(EXAM_PROMPT)
  })

  it("lets go of the preset when the text, the length or the style is changed, and takes it back on an exact match", async () => {
    const { user } = renderDialog()
    await user.click(await screen.findByRole("button", { name: "Exam prep" }))

    const field = screen.getByRole("textbox", { name: "Style instruction" })
    await user.click(field)
    await user.keyboard(" More.")
    expect(pressed("Exam prep")).toBe("false")
    await user.keyboard("{Backspace>6/}")
    expect(field).toHaveValue(EXAM_PROMPT)
    expect(pressed("Exam prep")).toBe("true")

    await user.click(screen.getByRole("button", { name: "Longer" }))
    expect(pressed("Exam prep")).toBe("false")
    expect(pressed("In depth")).toBe("false")
    await user.click(screen.getByRole("button", { name: "Default" }))
    expect(pressed("Exam prep")).toBe("true")

    await user.click(screen.getByRole("radio", { name: /Learning guide/ }))
    expect(pressed("Exam prep")).toBe("false")
    expect(pressed("Tutor")).toBe("true")
  })

  it("saves the whole configuration a preset filled, keeping the language and the goal", async () => {
    const patch = capturePatch()
    const { user } = renderDialog({ ...notebookDetail.chat_config, language: "ru", goal: "Pass biology" })

    await user.click(await screen.findByRole("button", { name: "Simple words" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(patch.body).toEqual({
        chat_config: {
          style: "custom",
          custom_prompt: SIMPLE_PROMPT,
          length: "shorter",
          language: "ru",
          goal: "Pass biology",
        },
      }),
    )
  })

  it("fills the instruction in the language of the interface", async () => {
    const { user } = renderDialog(undefined, { locale: "ru" })

    await user.click(await screen.findByRole("button", { name: "К экзамену" }))

    const field = screen.getByRole("textbox", { name: "Инструкция по стилю" })
    expect((field as HTMLTextAreaElement).value).toStartWith("Отвечай как чек-лист экзаменатора")
    expect(pressed("К экзамену")).toBe("true")
  })
})

describe("ChatConfigDialog: goal", () => {
  it("asks what the student is working on, up to 300 characters, and counts what is left", async () => {
    const { user } = renderDialog()

    const field = await screen.findByRole("textbox", { name: "Goal" })
    expect(field).toHaveAttribute("placeholder", "What are you working on?")
    expect(field).toHaveAttribute("maxlength", "300")
    expect(screen.getByText("300 characters left")).toBeInTheDocument()

    await user.click(field)
    await user.paste("Pass the biology exam")
    expect(screen.getByText("279 characters left")).toBeInTheDocument()

    await user.clear(field)
    await user.paste("a".repeat(299))
    expect(screen.getByText("1 character left")).toBeInTheDocument()
  })

  it("does not take more than 300 characters", async () => {
    const { user } = renderDialog()
    const field = await screen.findByRole("textbox", { name: "Goal" })

    await user.click(field)
    await user.paste("b".repeat(320))

    expect((field as HTMLTextAreaElement).value).toHaveLength(300)
    expect(screen.getByText("0 characters left")).toBeInTheDocument()
  })

  it("shows the saved goal", async () => {
    renderDialog({ ...notebookDetail.chat_config, goal: "Prepare for the olympiad" })

    expect(await screen.findByRole("textbox", { name: "Goal" })).toHaveValue("Prepare for the olympiad")
  })

  it("saves the goal without surrounding spaces", async () => {
    const patch = capturePatch()
    const { user } = renderDialog()

    await user.click(await screen.findByRole("textbox", { name: "Goal" }))
    await user.paste("  Pass the biology exam  ")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(patch.body).toEqual({
        chat_config: {
          style: "default",
          custom_prompt: null,
          length: "default",
          language: "auto",
          goal: "Pass the biology exam",
        },
      }),
    )
  })

  it("saves a cleared goal as null", async () => {
    const patch = capturePatch()
    const { user } = renderDialog({ ...notebookDetail.chat_config, goal: "Old goal" })

    await user.clear(await screen.findByRole("textbox", { name: "Goal" }))
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(patch.body).toEqual({ chat_config: { ...notebookDetail.chat_config, goal: null } }))
  })
})

describe("ChatConfigDialog: course workspace", () => {
  it("lets a read-only member look at the configuration but not save it", async () => {
    const patch = capturePatch()
    renderDialog({ ...courseWorkspaceReadOnly.chat_config, goal: "Mechanics" }, { notebook: courseWorkspaceReadOnly })

    expect(await screen.findByRole("dialog", { name: "Configure chat" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument()
    expect(screen.getByText("You can read this workspace but not change it.")).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Goal" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Tutor" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Longer" })).toBeDisabled()
    expect(screen.getByRole("radio", { name: /Learning guide/ })).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByRole("combobox", { name: "Answer language" })).toBeDisabled()
    expect(patch.body).toBeUndefined()
  })

  it("keeps Save for course staff who may change the workspace", async () => {
    renderDialog(undefined, { notebook: courseWorkspaceDetail })

    expect(await screen.findByRole("button", { name: "Save" })).toBeEnabled()
  })
})

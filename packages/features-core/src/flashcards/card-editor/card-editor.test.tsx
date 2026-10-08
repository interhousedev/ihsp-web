import { describe, expect, it, mock } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import { CardEditor, type CardEditorProps, type CardEditorValues } from "./card-editor"
import type { EditorRow } from "../utils/editor-rows"

const saved: EditorRow[] = [
  { key: "c1", id: "c1", front: "What is velocity?", back: "Rate of change of position" },
  { key: "c2", id: "c2", front: "What is acceleration?", back: "Rate of change of velocity" },
  { key: "c3", id: "c3", front: "Free fall", back: "9.8 m/s2" },
]

function setup(props: Partial<CardEditorProps> = {}) {
  const onSubmit = mock((_values: CardEditorValues, _practice: boolean) => undefined)
  const view = renderWithProviders(<CardEditor mode="create" cancelHref="/flashcards" onSubmit={onSubmit} {...props} />)
  return { ...view, onSubmit }
}

function rowItems(): HTMLElement[] {
  return within(screen.getByRole("list", { name: "Cards" })).getAllByRole("listitem")
}

function fields(index: number): { term: HTMLTextAreaElement; definition: HTMLTextAreaElement } {
  const row = rowItems()[index] as HTMLElement
  const [term, definition] = within(row).getAllByRole("textbox") as HTMLTextAreaElement[]
  return { term: term as HTMLTextAreaElement, definition: definition as HTMLTextAreaElement }
}

function rowNumber(index: number): HTMLElement {
  return within(rowItems()[index] as HTMLElement).getByTestId("card-number")
}

function pressCreate(practice = false) {
  const name = practice ? "Create and practice" : "Create"
  return screen.getAllByRole("button", { name })[0] as HTMLElement
}

describe("CardEditor, create mode (Quizlet's card creation)", () => {
  it("starts with a title, a description, an Import button and two numbered rows", () => {
    setup()

    expect(screen.getByRole("heading", { name: "Create a new flashcard set" })).toBeInTheDocument()
    expect(screen.getByLabelText("Title")).toBeInTheDocument()
    expect(screen.getByLabelText("Add a description…")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument()
    expect(rowItems()).toHaveLength(2)
    expect(rowNumber(1)).toHaveTextContent("2")
    expect(screen.getByRole("button", { name: "Add a card" })).toBeInTheDocument()
  })

  it("labels each field Term and Definition and each row has a drag handle and a delete button", () => {
    setup()

    const row = rowItems()[0] as HTMLElement
    expect(within(row).getByLabelText(/^Term/)).toBeInTheDocument()
    expect(within(row).getByLabelText(/^Definition/)).toBeInTheDocument()
    expect(within(row).getByRole("button", { name: /^Reorder card 1/ })).toBeInTheDocument()
    expect(within(row).getByRole("button", { name: "Delete card 1" })).toBeInTheDocument()
  })

  it("offers Create and Create and practice", () => {
    setup()

    expect(pressCreate()).toBeInTheDocument()
    expect(pressCreate(true)).toBeInTheDocument()
    expect(screen.getAllByRole("link", { name: "Cancel" })[0]).toHaveAttribute("href", "/flashcards")
  })

  it("does not submit without a title and says what is missing", async () => {
    const { user, onSubmit } = setup()
    await user.type(fields(0).term, "cat")
    await user.type(fields(0).definition, "кошка")

    await user.click(pressCreate())

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getAllByText("Enter a title.").length).toBeGreaterThan(0)
  })

  it("does not submit without a card", async () => {
    const { user, onSubmit } = setup()
    await user.type(screen.getByLabelText("Title"), "Animals")

    await user.click(pressCreate())

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText("Add at least one card.")).toBeInTheDocument()
  })

  it("flags a row with only one side and does not submit", async () => {
    const { user, onSubmit } = setup()
    await user.type(screen.getByLabelText("Title"), "Animals")
    await user.type(fields(0).term, "cat")

    await user.click(pressCreate())

    expect(onSubmit).not.toHaveBeenCalled()
    expect(rowItems()[0]).toHaveAttribute("data-invalid", "true")
    expect(within(rowItems()[0] as HTMLElement).getByRole("alert")).toHaveTextContent(
      "Fill in both sides or delete this card.",
    )
    expect(rowItems()[1]).toHaveAttribute("data-invalid", "false")
  })

  it("submits the trimmed title, description and the filled rows, leaving blank rows out", async () => {
    const { user, onSubmit } = setup()
    await user.type(screen.getByLabelText("Title"), "  Animals ")
    await user.type(screen.getByLabelText("Add a description…"), "Words")
    await user.type(fields(0).term, "cat")
    await user.type(fields(0).definition, " кошка ")

    await user.click(pressCreate())

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit.mock.calls[0]).toEqual([
      { title: "Animals", description: "Words", cards: [{ front: "cat", back: "кошка" }] },
      false,
    ])
  })

  it("Create and practice asks for practice", async () => {
    const { user, onSubmit } = setup({ initialTitle: "Animals", initialRows: [{ key: "x", front: "a", back: "b" }] })

    await user.click(pressCreate(true))

    expect(onSubmit.mock.calls[0]?.[1]).toBe(true)
  })

  it("adds a card at the end and puts the cursor in its term", async () => {
    const { user } = setup()

    await user.click(screen.getByRole("button", { name: "Add a card" }))

    expect(rowItems()).toHaveLength(3)
    expect(fields(2).term).toHaveFocus()
  })

  it("deletes a row and renumbers the rest", async () => {
    const { user } = setup({ initialRows: saved })

    await user.click(screen.getByRole("button", { name: "Delete card 1" }))

    expect(rowItems()).toHaveLength(2)
    expect(fields(0).term).toHaveValue("What is acceleration?")
    expect(rowNumber(0)).toHaveTextContent("1")
  })

  it("reorders with Alt and the arrow keys on the handle, and keeps the handle focused", async () => {
    const { user } = setup({ initialRows: saved })
    const handle = within(rowItems()[0] as HTMLElement).getByRole("button", { name: /^Reorder card 1/ })
    handle.focus()

    await user.keyboard("{Alt>}{ArrowDown}{/Alt}")

    expect(rowItems().map((_, index) => fields(index).term.value)).toEqual([
      "What is acceleration?",
      "What is velocity?",
      "Free fall",
    ])
    expect(screen.getByText("Card 1 moved to position 2 of 3.")).toBeInTheDocument()
    await waitFor(() =>
      expect(within(rowItems()[1] as HTMLElement).getByRole("button", { name: /^Reorder card 2/ })).toHaveFocus(),
    )

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}")

    expect(fields(0).term).toHaveValue("What is velocity?")
  })

  it("does not move the first row up or the last row down", async () => {
    const { user } = setup({ initialRows: saved })
    const first = within(rowItems()[0] as HTMLElement).getByRole("button", { name: /^Reorder card 1/ })
    first.focus()

    await user.keyboard("{Alt>}{ArrowUp}{/Alt}")

    expect(fields(0).term).toHaveValue("What is velocity?")
  })

  it("turns pasted lines of term, tab, definition into cards", async () => {
    setup()
    const { term } = fields(0)

    await act(async () => {
      fireEvent.paste(term, { clipboardData: { getData: () => "cat\tкошка\ndog\tсобака\nbird\tптица" } })
    })

    expect(rowItems()).toHaveLength(4)
    expect(rowItems().map((_, index) => fields(index).term.value)).toEqual(["cat", "dog", "bird", ""])
    expect(fields(1).definition).toHaveValue("собака")
  })

  it("leaves ordinary pasted text in the field", async () => {
    setup()
    const { term } = fields(0)

    await act(async () => {
      fireEvent.paste(term, { clipboardData: { getData: () => "just text" } })
    })

    expect(rowItems()).toHaveLength(2)
  })

  it("imports cards from the Import dialog", async () => {
    const { user } = setup()

    await user.click(screen.getByRole("button", { name: "Import" }))
    const dialog = await screen.findByRole("dialog")
    fireEvent.change(within(dialog).getByLabelText("Cards to import"), {
      target: { value: "one\t1\ntwo\t2\nbad line" },
    })

    expect(within(dialog).getByRole("status")).toHaveTextContent("2 cards found. 1 line was skipped.")
    await user.click(within(dialog).getByRole("button", { name: "Import 2 cards" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(rowItems().map((_, index) => fields(index).term.value)).toEqual(["one", "two"])
  })

  it("imports a comma separated file", async () => {
    const { user } = setup()
    await user.click(screen.getByRole("button", { name: "Import" }))
    const dialog = await screen.findByRole("dialog")
    const file = new File(["a,1\nb,2"], "words.csv", { type: "text/csv" })

    fireEvent.change(within(dialog).getByTestId("import-file-input"), { target: { files: [file] } })

    await waitFor(() => expect(within(dialog).getByRole("status")).toHaveTextContent("2 cards found."))
    expect(within(dialog).getByLabelText("Comma")).toBeChecked()
  })

  it("keeps Import disabled until something can be imported", async () => {
    const { user } = setup()

    await user.click(screen.getByRole("button", { name: "Import" }))
    const dialog = await screen.findByRole("dialog")

    expect(within(dialog).getByRole("button", { name: "Import 0 cards" })).toBeDisabled()
  })

  it("shows a Markdown preview of the sides when asked", async () => {
    const { user } = setup({ initialRows: [{ key: "x", front: "**bold**", back: "plain" }] })

    await user.click(screen.getByLabelText("Show Markdown preview"))

    expect(screen.getByText("bold").tagName).toBe("STRONG")
  })

  it("shows the error of the last submit and waits while saving", () => {
    setup({ isSubmitting: true, error: "Could not create the set." })

    expect(screen.getByText("Could not create the set.")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Saving…" })[0]).toBeDisabled()
  })
})

describe("CardEditor, edit mode", () => {
  it("shows the saved cards and the Save buttons", () => {
    setup({ mode: "edit", initialTitle: "Physics", initialDescription: "Basics", initialRows: saved })

    expect(screen.getByRole("heading", { name: "Edit cards" })).toBeInTheDocument()
    expect(screen.getByLabelText("Title")).toHaveValue("Physics")
    expect(rowItems()).toHaveLength(3)
    expect(screen.getAllByRole("button", { name: "Save" })[0]).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Save and practice" })[0]).toBeInTheDocument()
  })

  it("sends ids for saved cards so they keep their progress, in the new order", async () => {
    const { user, onSubmit } = setup({ mode: "edit", initialTitle: "Physics", initialRows: saved })
    const handle = within(rowItems()[2] as HTMLElement).getByRole("button", { name: /^Reorder card 3/ })
    handle.focus()
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}")
    await user.click(screen.getByRole("button", { name: "Add a card" }))
    await user.type(fields(3).term, "New")
    await user.type(fields(3).definition, "card")

    await user.click(screen.getAllByRole("button", { name: "Save" })[0] as HTMLElement)

    expect(onSubmit.mock.calls[0]?.[0].cards).toEqual([
      { id: "c1", front: "What is velocity?", back: "Rate of change of position" },
      { id: "c3", front: "Free fall", back: "9.8 m/s2" },
      { id: "c2", front: "What is acceleration?", back: "Rate of change of velocity" },
      { front: "New", back: "card" },
    ])
  })

  it("allows saving a set with no cards (all deleted)", async () => {
    const { user, onSubmit } = setup({
      mode: "edit",
      initialTitle: "Physics",
      initialRows: [{ key: "c1", id: "c1", front: "a", back: "b" }],
    })
    await user.click(screen.getByRole("button", { name: "Delete card 1" }))

    await user.click(screen.getAllByRole("button", { name: "Save" })[0] as HTMLElement)

    expect(onSubmit.mock.calls[0]?.[0].cards).toEqual([])
  })

  it("shows that there are unsaved changes", async () => {
    const { user } = setup({ mode: "edit", initialTitle: "Physics", initialRows: saved })
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument()

    await user.type(screen.getByLabelText("Title"), "!")

    expect(screen.getAllByText("Unsaved changes").length).toBeGreaterThan(0)
  })
})

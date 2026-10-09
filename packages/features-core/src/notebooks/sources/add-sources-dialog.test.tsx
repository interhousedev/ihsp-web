import { describe, expect, it, mock } from "bun:test"
import { apiUrl, filePdf, ids, nbIds, problem, resourceMaterialFile, server } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { AddSourcesDialog } from "./add-sources-dialog"

allowSlowRenders()

const sourcesUrl = (notebookId: string) => apiUrl(`/v1/notebooks/${notebookId}/sources`)

/**
 * `waitFor` on a boolean. A failed element matcher builds a message that prints the element, which is very slow in
 * happy-dom, so conditions that are false at first (an optimistic flip, a closing dialog) are polled this way.
 */
function until(check: () => boolean, timeout?: number) {
  return waitFor(
    () => {
      if (!check()) throw new Error("condition not met yet")
    },
    timeout ? { timeout } : undefined,
  )
}

function isDisabled(element: HTMLElement) {
  return (element as HTMLButtonElement).disabled === true || element.getAttribute("aria-disabled") === "true"
}

/** The dialog for a notebook without sources (the main notebook already holds a file, a lesson material and a text). */
function renderDialog(notebookId: string = nbIds.notebookEmpty) {
  const onOpenChange = mock((_open: boolean) => undefined)
  const view = renderNotebook(<AddSourcesDialog notebookId={notebookId} open onOpenChange={onOpenChange} />, {
    actions: { notebookId },
  })
  return { ...view, onOpenChange }
}

type Captured = { body: { items: Record<string, unknown>[] } | null }

/** Records the body of `POST .../sources` and accepts everything. */
function captureAdd(notebookId: string = nbIds.notebookEmpty): Captured {
  const captured: Captured = { body: null }
  server.use(
    http.post(sourcesUrl(notebookId), async ({ request }) => {
      captured.body = (await request.json()) as Captured["body"]
      return HttpResponse.json({ items: [], rejected: [] }, { status: 201 })
    }),
  )
  return captured
}

async function openTab(user: ReturnType<typeof renderDialog>["user"], name: string) {
  await user.click(await screen.findByRole("tab", { name }))
}

describe("AddSourcesDialog", () => {
  describe("My files", () => {
    it("lists ready files, disables the ones without text and adds a ticked file in one request", async () => {
      const captured = captureAdd()
      const { user, onOpenChange } = renderDialog()

      const pdf = await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" })
      expect(isDisabled(screen.getByRole("checkbox", { name: "lab-setup.jpg" }))).toBe(true)
      expect(screen.getByText(/No readable text/)).toBeInTheDocument()
      expect(screen.queryByRole("checkbox", { name: "installer.exe" })).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Add 0 sources" })).toBeDisabled()

      await user.click(pdf)
      expect(screen.getByText("1 selected")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Add 1 source" }))

      await waitFor(() => expect(captured.body).toEqual({ items: [{ kind: "file", file_id: filePdf.id }] }))
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it("disables a file that is already a source of the notebook", async () => {
      renderDialog(nbIds.notebook)

      const pdf = await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" })
      await until(() => isDisabled(pdf))
      expect(pdf).toBeChecked()
      expect(screen.getByText(/Already added/)).toBeInTheDocument()
    })

    it("filters the list by name", async () => {
      const { user } = renderDialog()
      await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" })

      await user.click(screen.getByRole("searchbox", { name: "Search files" }))
      await user.paste("lab")

      await waitFor(() =>
        expect(screen.queryByRole("checkbox", { name: "kinematics-notes.pdf" })).not.toBeInTheDocument(),
      )
      expect(screen.getByRole("checkbox", { name: "lab-setup.jpg" })).toBeInTheDocument()
    })

    it("adds an uploaded file automatically once it is verified", async () => {
      const captured = captureAdd()
      renderDialog()
      await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" })

      fireEvent.change(screen.getByTestId("file-upload-input"), {
        target: { files: [new File(["hello world"], "chapter.pdf", { type: "application/pdf" })] },
      })

      await waitFor(() => expect(captured.body?.items[0]?.kind).toBe("file"))
      expect(typeof captured.body?.items[0]?.file_id).toBe("string")
      expect(captured.body?.items).toHaveLength(1)
    })

    it("uploads a file dropped on the tab", async () => {
      const captured = captureAdd()
      renderDialog()
      const pdf = await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" })

      fireEvent.drop(pdf, {
        dataTransfer: { files: [new File(["hello"], "dropped.txt", { type: "text/plain" })], types: ["Files"] },
      })

      await waitFor(() => expect(captured.body?.items[0]?.kind).toBe("file"))
    })

    it("shows an error with a retry", async () => {
      server.use(http.get(apiUrl("/v1/me/files"), () => problem(500, "common/internal", "Boom"), { once: true }))
      const { user } = renderDialog()

      await user.click(await screen.findByRole("button", { name: "Try again" }))

      expect(await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" })).toBeInTheDocument()
    })
  })

  describe("other tabs", () => {
    it("adds chats (the assistant chats of the student only)", async () => {
      const captured = captureAdd()
      const { user } = renderDialog()
      await openTab(user, "Chats")

      await user.click(await screen.findByRole("checkbox", { name: "Kinematics revision" }))
      await user.click(screen.getByRole("checkbox", { name: "Homework help" }))
      expect(screen.queryByRole("checkbox", { name: "Weekly attendance" })).not.toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Add 2 sources" }))

      await waitFor(() =>
        expect(captured.body).toEqual({
          items: [
            { kind: "chat", chat_id: ids.chat },
            { kind: "chat", chat_id: ids.chat2 },
          ],
        }),
      )
    })

    it("shows an empty state when there are no chats", async () => {
      server.use(http.get(apiUrl("/v1/ai/chats"), () => HttpResponse.json({ items: [], next_cursor: null })))
      const { user } = renderDialog()
      await openTab(user, "Chats")

      expect(await screen.findByText(/No chats yet/)).toBeInTheDocument()
    })

    it("adds a lesson material after choosing a subject, URL materials included", async () => {
      const captured = captureAdd()
      const { user } = renderDialog()
      await openTab(user, "Lessons")

      await user.selectOptions(await screen.findByLabelText("Subject"), "Physics")
      await user.click(await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" }))
      const web = screen.getByRole("checkbox", { name: "Khan Academy: physics" })
      expect(isDisabled(web)).toBe(false)
      await user.click(web)
      await user.click(screen.getByRole("button", { name: "Add 2 sources" }))

      await waitFor(() =>
        expect(captured.body).toEqual({
          items: [
            { kind: "lesson_resource", lesson_id: ids.lessonPhysicsToday, link_id: resourceMaterialFile.link_id },
            { kind: "lesson_resource", lesson_id: ids.lessonPhysicsToday, link_id: ids.link },
          ],
        }),
      )
    })

    it("disables a lesson material that is already a source", async () => {
      const { user } = renderDialog(nbIds.notebook)
      await openTab(user, "Lessons")

      await user.selectOptions(await screen.findByLabelText("Subject"), "Physics")

      const khan = await screen.findByRole("checkbox", { name: "Khan Academy: physics" })
      await until(() => isDisabled(khan))
      expect(isDisabled(screen.getByRole("checkbox", { name: "kinematics-notes.pdf" }))).toBe(false)
    })

    it("adds a flash card set and shows the card count", async () => {
      const captured = captureAdd()
      const { user } = renderDialog()
      await openTab(user, "Flash cards")

      const set = await screen.findByRole("checkbox", { name: "Physics: kinematics" })
      expect(screen.getByText("4 cards")).toBeInTheDocument()
      await user.click(set)
      await user.click(screen.getByRole("button", { name: "Add 1 source" }))

      await waitFor(() =>
        expect(captured.body).toEqual({ items: [{ kind: "flashcard_set", set_id: ids.flashcardSet }] }),
      )
    })

    it("adds a course step from the outline and says that tests are left out", async () => {
      const captured = captureAdd()
      const { user } = renderDialog()
      await openTab(user, "Courses")

      await user.click(await screen.findByRole("button", { name: /Derivatives 101/ }))
      const step = await screen.findByRole("checkbox", { name: "What is a derivative?" })
      expect(screen.getByText("Tests are left out")).toBeInTheDocument()
      await user.click(step)
      await user.click(screen.getByRole("button", { name: "Add 1 source" }))

      await waitFor(() =>
        expect(captured.body).toEqual({
          items: [{ kind: "lms_step", course_id: ids.course, step_id: ids.courseStepText }],
        }),
      )
    })

    it("adds pasted text with its title", async () => {
      const captured = captureAdd()
      const { user, onOpenChange } = renderDialog()
      await openTab(user, "Text")

      await user.click(screen.getByLabelText("Title"))
      await user.paste("Study plan")
      await user.click(screen.getByLabelText("Paste text here"))
      await user.paste("Week 1: the Calvin cycle.\nWeek 2: limiting factors.")
      expect(screen.getByText("1 selected")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Add text" }))

      await waitFor(() =>
        expect(captured.body).toEqual({
          items: [{ kind: "text", title: "Study plan", text: "Week 1: the Calvin cycle.\nWeek 2: limiting factors." }],
        }),
      )
      await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it("needs both a title and some text before it can be added", async () => {
      const { user } = renderDialog()
      await openTab(user, "Text")

      await user.click(screen.getByLabelText("Paste text here"))
      await user.paste("Only a body")

      expect(screen.getByRole("button", { name: "Add text" })).toBeDisabled()
      expect(screen.getByText("0 selected")).toBeInTheDocument()
    })

    it("adds several links separated by spaces or new lines and skips what is not an address", async () => {
      const captured = captureAdd()
      const { user } = renderDialog()
      await openTab(user, "Link")

      await user.click(screen.getByLabelText("Links"))
      await user.paste("https://example.com/a https://example.org/b\nnope")
      expect(screen.getByText("Not web addresses, skipped: nope")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Add 2 links" }))

      await waitFor(() =>
        expect(captured.body).toEqual({
          items: [
            { kind: "url", url: "https://example.com/a" },
            { kind: "url", url: "https://example.org/b" },
          ],
        }),
      )
    })
  })

  describe("selection and results", () => {
    it("keeps the selection while the student switches tabs and sends everything in one request", async () => {
      const captured = captureAdd()
      const { user } = renderDialog()
      await user.click(await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" }))
      await openTab(user, "Chats")
      await user.click(await screen.findByRole("checkbox", { name: "Homework help" }))
      await openTab(user, "My files")

      expect(await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" })).toBeChecked()
      expect(screen.getByText("2 selected")).toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: "Add 2 sources" }))

      await waitFor(() =>
        expect(captured.body).toEqual({
          items: [
            { kind: "file", file_id: filePdf.id },
            { kind: "chat", chat_id: ids.chat2 },
          ],
        }),
      )
    })

    it("lists rejected items with their reason, removes them from the selection and keeps the dialog open", async () => {
      server.use(
        http.post(sourcesUrl(nbIds.notebookEmpty), () =>
          HttpResponse.json(
            {
              items: [],
              rejected: [
                {
                  index: 1,
                  error: {
                    type: "notebooks/source-forbidden",
                    title: "Forbidden",
                    message_key: "notebooks.source-forbidden",
                    params: {},
                  },
                },
              ],
            },
            { status: 201 },
          ),
        ),
      )
      const { user, onOpenChange } = renderDialog()
      await user.click(await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" }))
      await openTab(user, "Chats")
      await user.click(await screen.findByRole("checkbox", { name: "Homework help" }))
      await user.click(screen.getByRole("button", { name: "Add 2 sources" }))

      const alert = await screen.findByRole("alert")
      expect(within(alert).getByText("Homework help: You cannot add this item as a source.")).toBeInTheDocument()
      expect(screen.getByText("0 selected")).toBeInTheDocument()
      expect(screen.getByRole("checkbox", { name: "Homework help" })).not.toBeChecked()
      expect(onOpenChange).not.toHaveBeenCalledWith(false)
    })

    it("keeps the selection and says why when the whole request fails", async () => {
      server.use(http.post(sourcesUrl(nbIds.notebookEmpty), () => problem(500, "common/internal", "Boom")))
      const { user } = renderDialog()
      await user.click(await screen.findByRole("checkbox", { name: "kinematics-notes.pdf" }))

      await user.click(screen.getByRole("button", { name: "Add 1 source" }))

      expect(await screen.findByRole("alert")).toBeInTheDocument()
      expect(screen.getByText("1 selected")).toBeInTheDocument()
    })

    it("refuses more than 20 items in one request", async () => {
      const { user } = renderDialog()
      await openTab(user, "Link")

      await user.click(screen.getByLabelText("Links"))
      await user.paste(Array.from({ length: 21 }, (_, index) => `https://example.com/${index}`).join(" "))

      expect(screen.getByText("You can add up to 20 sources at a time.")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Add 21 sources" })).toBeDisabled()
    })
  })

  it("is a full-height drawer on a phone", async () => {
    const width = window.innerWidth
    window.innerWidth = 360
    try {
      renderDialog()

      expect(await screen.findByRole("dialog")).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: "My files" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
    } finally {
      window.innerWidth = width
    }
  })
})

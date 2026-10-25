/** AI notebooks in the staff app: the list, creating a notebook, and "Attach to lesson" for a Studio output. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { mergeMessages, type Messages } from "@ihsp/i18n"
import { apiUrl, nbIds, server, weekLessons } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { NotebooksPage } from "../features/notebooks/components/notebooks-page"
import { AttachToLesson } from "../features/notebooks/components/attach-to-lesson"
import { configureTests, freezeTime, messages, renderStaff, unfreezeTime } from "./helpers"

configureTests()

beforeEach(freezeTime)
afterEach(unfreezeTime)

/** The app loads the student app's notebook texts next to its own (see `app/providers.tsx`). */
const notebookTexts = JSON.parse(
  readFileSync(join(import.meta.dir, "../../../sp/messages/en/notebooks.json"), "utf8"),
) as Messages
const withNotebooks = mergeMessages(messages.en as Messages, notebookTexts)

describe("notebooks list", () => {
  test("a teacher sees the notebooks and can start a new one", async () => {
    renderStaff(<NotebooksPage />, { route: "/notebooks/", messages: withNotebooks })

    expect(await screen.findByRole("link", { name: /Photosynthesis/ })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "New notebook" }).length).toBeGreaterThan(0)
  })
})

describe("attach to lesson", () => {
  const lesson = weekLessons[0]
  if (!lesson) throw new Error("fixture: no lessons")

  test("a ready report is attached to the chosen lesson", async () => {
    const bodies: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/notebooks/:id/artifacts/:aid/attach-to-lesson"), async ({ request, params }) => {
        bodies.push({ ...((await request.json()) as object), aid: params.aid })
        return HttpResponse.json(
          { link_id: "l1", lesson_id: lesson.id, title: "Report.docx", short_url: "https://go.test/r" },
          { status: 201 },
        )
      }),
    )
    const { user } = renderStaff(<AttachToLesson notebookId={nbIds.notebook} artifactId={nbIds.report} />, {
      messages: withNotebooks,
    })

    await user.click(await screen.findByTestId("attach-to-lesson"))
    const dialog = await screen.findByRole("dialog")
    const choices = await within(dialog).findByRole("list", { name: "Attach to a lesson" })
    await user.click(within(choices).getAllByRole("button")[0] as HTMLElement)

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({ lesson_id: expect.any(String), role: "material", aid: nbIds.report })
    expect(await within(dialog).findByRole("link", { name: "Open the lesson" })).toBeInTheDocument()
  })

  test("an output without a file format shows no button", async () => {
    renderStaff(<AttachToLesson notebookId={nbIds.notebook} artifactId={nbIds.quiz} />, { messages: withNotebooks })

    await waitFor(() => expect(screen.queryByTestId("attach-to-lesson")).not.toBeInTheDocument())
  })
})

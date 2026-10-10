import { describe, expect, it } from "bun:test"
import type { ArtifactCreate, ArtifactItem, NotebookDetail } from "@ihsp/api"
import {
  apiUrl,
  artifactGenerating,
  courseIds,
  courseWorkspaceDetail,
  courseWorkspaceReadOnly,
  server,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderNotebook } from "../test-support"
import { StudioPanel } from "./studio-panel"

allowSlowRenders()

const ARTIFACTS_URL = apiUrl(`/v1/notebooks/${courseIds.workspace}/artifacts`)

function captureCreates(): ArtifactCreate[] {
  const bodies: ArtifactCreate[] = []
  server.use(
    http.post(ARTIFACTS_URL, async ({ request }) => {
      const body = (await request.json()) as ArtifactCreate
      bodies.push(body)
      const item: ArtifactItem = {
        ...artifactGenerating,
        id: `new-${bodies.length}`,
        kind: body.kind,
        status: "queued",
      }
      return HttpResponse.json(item, { status: 202 })
    }),
  )
  return bodies
}

function renderPanel(notebook: NotebookDetail = courseWorkspaceDetail) {
  return renderNotebook(<StudioPanel notebook={notebook} />, {
    actions: { notebookId: notebook.id },
  })
}

describe("StudioPanel in a course workspace", () => {
  it("offers the course tiles instead of the student ones", async () => {
    renderPanel()

    const tiles = within(await screen.findByRole("list", { name: "Create study materials" }))
    expect(tiles.getByRole("button", { name: "Course plan" })).toBeInTheDocument()
    expect(tiles.getByRole("button", { name: "Lesson draft" })).toBeInTheDocument()
    expect(tiles.getByRole("button", { name: "Test questions" })).toBeInTheDocument()
    expect(tiles.getByRole("button", { name: "Flash cards" })).toBeInTheDocument()
    expect(tiles.queryByRole("button", { name: "Infographic" })).not.toBeInTheDocument()
    expect(tiles.queryByRole("button", { name: "Data table" })).not.toBeInTheDocument()
  })

  it("starts a course plan with the default options", async () => {
    const bodies = captureCreates()
    const { user } = renderPanel()

    await user.click(await screen.findByRole("button", { name: "Course plan" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "course_plan",
      options: { depth: "overview" },
    })
  })

  it("starts a quiz of a workspace as a normal quiz request", async () => {
    const bodies = captureCreates()
    const { user } = renderPanel()

    await user.click(await screen.findByRole("button", { name: "Test questions" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]?.kind).toBe("quiz")
  })

  it("customizes a lesson draft: a step of the draft, length, test and cards", async () => {
    const bodies = captureCreates()
    const { user } = renderPanel()

    await user.click(await screen.findByRole("button", { name: "Customize Lesson draft" }))
    const dialog = await screen.findByRole("dialog")
    await user.selectOptions(within(dialog).getByLabelText("Write it for"), courseIds.stepKinematics)
    await user.click(within(dialog).getByRole("button", { name: "Long" }))
    await user.click(
      within(dialog).getByRole("checkbox", {
        name: "Add a test with questions",
      }),
    )
    await user.click(within(dialog).getByRole("button", { name: "Generate" }))

    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toEqual({
      kind: "lesson_draft",
      options: {
        step_id: courseIds.stepKinematics,
        length: "long",
        include_test: true,
      },
    })
  })

  it("checks the number of sections of a course plan", async () => {
    const { user } = renderPanel()

    await user.click(await screen.findByRole("button", { name: "Customize Course plan" }))
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByLabelText("Number of sections (optional)"), "99")

    expect(within(dialog).getByRole("alert")).toHaveTextContent("From 1 to 20.")
    expect(within(dialog).getByRole("button", { name: "Generate" })).toBeDisabled()
  })

  it("is off for a reader of the course", async () => {
    renderPanel(courseWorkspaceReadOnly)

    const tile = await screen.findByRole("button", { name: "Course plan" })
    expect(tile).toBeDisabled()
    expect(screen.getAllByText("You can read this workspace but not change it.").length).toBeGreaterThan(0)
    expect(screen.queryByRole("button", { name: "Add note" })).not.toBeInTheDocument()
  })
})

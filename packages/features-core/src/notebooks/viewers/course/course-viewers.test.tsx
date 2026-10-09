import { afterEach, describe, expect, it } from "bun:test"
import type { ArtifactDetail } from "@ihsp/api"
import {
  artifactCoursePlan,
  artifactLessonDraft,
  artifactQuiz,
  artifactDetailOf,
  courseArtifactDetailOf,
  courseIds,
  nbIds,
  setCourseApplyMode,
  setCourseWorkspaceReadOnly,
} from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import { allowSlowRenders, renderNotebook } from "../../test-support"
import { ApplyBar } from "./apply-bar"
import { CoursePlanViewer } from "./course-plan-viewer"
import { LessonDraftViewer } from "./lesson-draft-viewer"

allowSlowRenders()

afterEach(() => {
  window.innerWidth = 1280
})

function planArtifact(): Extract<ArtifactDetail, { kind: "course_plan" }> {
  const detail = courseArtifactDetailOf(artifactCoursePlan)
  if (detail.kind !== "course_plan") throw new Error("fixture is not a course plan")
  return detail
}

function lessonArtifact(): Extract<ArtifactDetail, { kind: "lesson_draft" }> {
  const detail = courseArtifactDetailOf(artifactLessonDraft)
  if (detail.kind !== "lesson_draft") throw new Error("fixture is not a lesson draft")
  return detail
}

function renderPlan() {
  return renderNotebook(<CoursePlanViewer notebookId={courseIds.workspace} artifact={planArtifact()} />, {
    actions: { notebookId: courseIds.workspace },
  })
}

function renderLesson() {
  return renderNotebook(<LessonDraftViewer notebookId={courseIds.workspace} artifact={lessonArtifact()} />, {
    actions: { notebookId: courseIds.workspace },
  })
}

describe("CoursePlanViewer", () => {
  it("shows the plan as editable titles, goals and summaries", async () => {
    renderPlan()

    expect(await screen.findByRole("textbox", { name: "Title of section 1" })).toHaveValue("Motion")
    expect(screen.getByRole("textbox", { name: "Title of section 2" })).toHaveValue("Energy")
    expect(screen.getByRole("textbox", { name: "Title of step 1.2" })).toHaveValue("Newton's laws")
    expect(
      screen.getByDisplayValue(
        "A first course in mechanics: describing motion, then explaining it with forces and energy.",
      ),
    ).toBeInTheDocument()
  })

  it("edits a title, offers to undo the edits and restores the plan", async () => {
    const { user } = renderPlan()
    const title = await screen.findByRole("textbox", { name: "Title of section 1" })

    await user.clear(title)
    await user.type(title, "Mechanics")
    expect(screen.getByRole("textbox", { name: "Title of section 1" })).toHaveValue("Mechanics")

    await user.click(screen.getByRole("button", { name: "Undo my edits" }))
    expect(screen.getByRole("textbox", { name: "Title of section 1" })).toHaveValue("Motion")
    expect(screen.queryByRole("button", { name: "Undo my edits" })).not.toBeInTheDocument()
  })

  it("moves and removes steps and sections", async () => {
    const { user } = renderPlan()
    await screen.findByRole("textbox", { name: "Title of section 1" })

    const first = screen.getByRole("textbox", { name: "Title of step 1.1" })
    const row = first.closest("li") as HTMLElement
    await user.click(within(row).getByRole("button", { name: "Move down" }))
    expect(screen.getByRole("textbox", { name: "Title of step 1.1" })).toHaveValue("Newton's laws")

    await user.click(within(row).getByRole("button", { name: "Remove step" }))
    expect(screen.queryByRole("textbox", { name: "Title of step 1.2" })).not.toBeInTheDocument()

    const sectionTitle = screen.getByRole("textbox", { name: "Title of section 2" })
    const section = sectionTitle.closest("li") as HTMLElement
    await user.click(within(section).getAllByRole("button", { name: "Remove section" })[0] as HTMLElement)
    expect(screen.queryByRole("textbox", { name: "Title of section 2" })).not.toBeInTheDocument()
  })

  it("blocks Apply while a title is empty", async () => {
    const { user } = renderPlan()
    await screen.findByRole("textbox", { name: "Title of section 1" })

    await user.click(screen.getByRole("button", { name: "Add section" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Every section and step needs a title.")
    expect(screen.getByRole("button", { name: "Apply to course" })).toBeDisabled()
  })

  it("previews what is new, then applies the plan and links to the editor", async () => {
    const { user } = renderPlan()

    await user.click(await screen.findByRole("button", { name: "Apply to course" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText(/Creates the sections and steps/)).toBeInTheDocument()
    expect(await within(dialog).findByText(/1 new section, 2 new steps/)).toBeInTheDocument()
    expect(within(dialog).getAllByText("New").length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText("Exists").length).toBeGreaterThan(0)

    await user.click(within(dialog).getByRole("button", { name: "Apply" }))

    expect(await within(dialog).findByText(/1 section and 2 steps created in the draft/)).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: "Open in editor" })).toHaveAttribute(
      "href",
      `/edit/?id=${courseIds.course}`,
    )
  })

  it("reloads the preview and says so when the draft changed meanwhile (409)", async () => {
    setCourseApplyMode("conflict")
    const { user } = renderPlan()
    await user.click(await screen.findByRole("button", { name: "Apply to course" }))
    const dialog = await screen.findByRole("dialog")
    const apply = await within(dialog).findByRole("button", { name: "Apply" })
    await waitFor(() => expect(apply).toBeEnabled())

    await user.click(apply)

    expect(await within(dialog).findByText(/changed meanwhile/)).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Apply" })).toBeEnabled())
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))
    expect(await within(dialog).findByText(/created in the draft/)).toBeInTheDocument()
  })

  it("is read-only for a reader of the course", async () => {
    setCourseWorkspaceReadOnly(true)
    renderPlan()

    const title = await screen.findByRole("textbox", { name: "Title of section 1" })
    await waitFor(() => expect(title).toBeDisabled())
    expect(screen.queryByRole("button", { name: "Apply to course" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add section" })).not.toBeInTheDocument()
  })
})

describe("LessonDraftViewer", () => {
  it("renders the text, the test and the flash cards of the draft", async () => {
    renderLesson()

    expect(await screen.findByRole("heading", { name: "Goal" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Test: 1 question/ })).toBeInTheDocument()
    expect(screen.getByText("6 N")).toBeInTheDocument()
    expect(screen.getByText("correct")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /1 flash card/ })).toBeInTheDocument()
  })

  it("previews a replace as a diff and applies it to the step it was written for", async () => {
    const { user } = renderLesson()

    await user.click(await screen.findByRole("button", { name: "Apply to step" }))
    const dialog = await screen.findByRole("dialog")

    expect(await within(dialog).findByText(/The content of “Newton's laws” is replaced/)).toBeInTheDocument()
    expect(within(dialog).getByLabelText("Step")).toHaveValue(courseIds.stepNewLaws)
    expect(within(dialog).getByRole("radio", { name: "Replace the content" })).toBeChecked()
    await user.click(within(dialog).getByRole("button", { name: "Apply" }))

    expect(await within(dialog).findByText(/step draft is updated/)).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: "Open in editor" })).toHaveAttribute(
      "href",
      `/edit/step/?id=${courseIds.stepNewLaws}`,
    )
  })

  it("lists the problems of a draft the server refuses and keeps Apply disabled", async () => {
    setCourseApplyMode("invalid")
    const { user } = renderLesson()

    await user.click(await screen.findByRole("button", { name: "Apply to step" }))
    const dialog = await screen.findByRole("dialog")

    expect(await within(dialog).findByText(/exactly one correct option/)).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Apply" })).toBeDisabled()
  })
})

describe("ApplyBar", () => {
  it("offers Apply to step for a quiz of a course workspace", async () => {
    renderNotebook(<ApplyBar notebookId={courseIds.workspace} artifact={artifactDetailOf(artifactQuiz)} />, {
      actions: { notebookId: courseIds.workspace },
    })

    expect(await screen.findByRole("button", { name: "Apply to step" })).toBeInTheDocument()
  })

  it("shows nothing in a student's own notebook", async () => {
    const { container } = renderNotebook(
      <ApplyBar notebookId={nbIds.notebook} artifact={artifactDetailOf(artifactQuiz)} />,
    )

    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})

import { describe, expect, it } from "bun:test"
import { getLibraryItem, getMyUploads } from "@ihsp/api"
import {
  libActors,
  libDetails,
  libIds,
  makeItemDetail,
  makeItemFile,
  seedLibraryItem,
  setLibraryActor,
} from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { allowSlowRenders, renderLibrary } from "../test-support"
import { UploadEditPage } from "./upload-edit-page"

allowSlowRenders()

const renderEdit = (id: string) => renderLibrary(<UploadEditPage />, { route: `/upload/edit/?id=${id}` })
const next = (user: ReturnType<typeof renderLibrary>["user"]) =>
  user.click(screen.getByRole("button", { name: "Next" }))

describe("UploadEditPage: continue a draft", () => {
  it("opens the saved draft with its values, without the attestation step", async () => {
    const { user } = renderEdit(libIds.matDraft)

    expect(await screen.findByRole("heading", { level: 1, name: "Continue your upload" })).toBeInTheDocument()
    // The draft has no file yet, so the kind of file is asked first.
    expect(screen.getByTestId("step-progress")).toHaveTextContent("Step 1 of 4: Kind of file")
    await user.click(screen.getByRole("radio", { name: /PDF file/ }))
    await next(user)

    expect(await screen.findByLabelText("Title")).toHaveValue("Kinematics formula sheet")
    expect(
      screen.getByText("Subjects, year, type and language cannot be changed once the draft is saved."),
    ).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Physics" })).toBeInTheDocument()
    expect(screen.queryByRole("checkbox", { name: "Year 1" })).not.toBeInTheDocument()
  })

  it("lets the user finish the draft: edit the title, add the file, submit", async () => {
    const { user } = renderEdit(libIds.matDraft)
    await user.click(await screen.findByRole("radio", { name: /PDF file/ }))
    await next(user)
    const title = await screen.findByLabelText("Title")
    await user.clear(title)
    await user.type(title, "Kinematics formulas, v2")
    await next(user)
    fireEvent.change(await screen.findByTestId("pdf-input"), {
      target: { files: [new File(["%PDF-1.4"], "formulas.pdf", { type: "application/pdf" })] },
    })

    await next(user)

    expect(await screen.findByRole("heading", { level: 2, name: "Review and submit" })).toBeInTheDocument()
    expect(screen.getByText("Title", { selector: "dt" }).nextElementSibling).toHaveTextContent(
      "Kinematics formulas, v2",
    )
    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(await screen.findByText("Sent for review")).toBeInTheDocument()
    const pending = await getMyUploads({ status: "pending_review" })
    expect(pending.items.map((row) => row.item.title)).toContain("Kinematics formulas, v2")
  })

  it("loads the text of a Markdown draft into the editor", async () => {
    const id = "00000029-0000-4000-8000-0000000000aa"
    seedLibraryItem(
      makeItemDetail({
        ...libDetails.matDraft,
        id,
        slug: "my-note",
        title: "My note",
        has_text: true,
        files: [makeItemFile({ id: "0000002a-0000-4000-8000-0000000000aa", format: "md", pages: null })],
      }),
      { ownerId: libActors.student.id, text: ["## Saved heading\n\nSaved text"] },
    )
    const { user } = renderEdit(id)

    expect(await screen.findByLabelText("Title")).toHaveValue("My note")
    // The kind is known from the file, so the wizard starts at the details and has three steps.
    expect(screen.getByTestId("step-progress")).toHaveTextContent("Step 1 of 3")
    await next(user)

    const editor = await screen.findByRole("textbox", { name: "Text of the note (Markdown)" })
    expect(editor).toHaveValue("## Saved heading\n\nSaved text")
  })
})

describe("UploadEditPage: changes requested", () => {
  it("shows the reviewer's message and reason, keeps the file, and resubmits", async () => {
    const { user } = renderEdit(libIds.matChanges)

    expect(await screen.findByRole("heading", { level: 1, name: "Fix and resubmit" })).toBeInTheDocument()
    const note = screen.getByRole("note")
    expect(note).toHaveTextContent("Please remove the phone number on page 2 and upload the file again.")
    expect(note).toHaveTextContent("Personal data")
    await next(user)
    expect(await screen.findByTestId("existing-file")).toHaveTextContent(
      "The saved file stays unless you choose another",
    )
    await next(user)
    expect(await screen.findByRole("heading", { level: 2, name: "Review and submit" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Resubmit" }))

    expect(await screen.findByText("Sent for review")).toBeInTheDocument()
    const pending = await getMyUploads({ status: "pending_review" })
    expect(pending.items.map((row) => row.item.id)).toContain(libIds.matChanges)
    const item = await getLibraryItem(libIds.matChanges)
    expect(item.status).toBe("pending_review")
  })

  it("replaces the file with a new one before resubmitting", async () => {
    const { user } = renderEdit(libIds.matChanges)
    await screen.findByRole("heading", { level: 1, name: "Fix and resubmit" })
    await next(user)

    fireEvent.change(await screen.findByTestId("pdf-input"), {
      target: { files: [new File(["%PDF-1.4"], "fixed.pdf", { type: "application/pdf" })] },
    })
    expect(screen.getByTestId("chosen-file")).toHaveTextContent("fixed.pdf")
    await next(user)

    expect(await screen.findByText(/fixed\.pdf/)).toBeInTheDocument()
  })
})

describe("UploadEditPage: items that cannot be edited", () => {
  it("explains a rejected item with the reviewer's message and offers a new upload", async () => {
    renderEdit(libIds.matRejected)

    expect(await screen.findByText("This material cannot be changed")).toBeInTheDocument()
    expect(screen.getByRole("note")).toHaveTextContent("Answers to current homework are not allowed.")
    expect(screen.getByRole("link", { name: "Start a new upload" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/upload\/?$/),
    )
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument()
  })

  it("says 'not available' for an unknown item and for somebody else's draft", async () => {
    const first = renderEdit("nope")
    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
    first.unmount()

    renderEdit(libIds.matTeacherDraft)
    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })

  it("is not available without an id", async () => {
    renderLibrary(<UploadEditPage />, { route: "/upload/edit/" })

    expect(await screen.findByText("This item is not available")).toBeInTheDocument()
  })
})

describe("UploadEditPage: a published material", () => {
  it("changes the title and description at any time without a new review", async () => {
    setLibraryActor("student")
    const { user } = renderEdit(libIds.matPublished)

    expect(await screen.findByRole("heading", { level: 1, name: "Edit your material" })).toBeInTheDocument()
    expect(screen.getByText(/Status: Published/)).toBeInTheDocument()
    const title = screen.getByLabelText("Title")
    await user.clear(title)
    await user.type(title, "Kinematika: yangilangan konspekt")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(async () => {
      const item = await getLibraryItem(libIds.matPublished)
      expect(item.title).toBe("Kinematika: yangilangan konspekt")
      expect(item.status).toBe("published")
    })
    expect(screen.getByRole("link", { name: "View in the library" })).toBeInTheDocument()
  })
})

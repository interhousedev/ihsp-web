import { describe, expect, it } from "bun:test"
import { getMyUploads } from "@ihsp/api"
import { apiUrl, problem, server, setLibraryActor, teacherMe, testRouter } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import axe from "axe-core"
import { HttpResponse, http } from "msw"
import { allowSlowRenders, renderLibrary } from "../test-support"
import { UploadWizard } from "./upload-wizard"

allowSlowRenders()

type Rendered = ReturnType<typeof renderLibrary>

function renderWizard(as: "student" | "teacher" = "student") {
  if (as === "teacher") setLibraryActor("teacher")
  return renderLibrary(<UploadWizard />, {
    route: "/upload/",
    ...(as === "teacher" ? { session: { user: teacherMe } } : {}),
  })
}

const next = (user: Rendered["user"]) => user.click(screen.getByRole("button", { name: "Next" }))

async function chooseKind(user: Rendered["user"], name: RegExp) {
  await user.click(screen.getByRole("radio", { name }))
  await next(user)
}

async function fillDetails(user: Rendered["user"]) {
  await user.type(await screen.findByLabelText("Title"), "Kinematics notes")
  await user.click(await screen.findByRole("checkbox", { name: "Physics" }))
  await user.click(screen.getByRole("checkbox", { name: "Year 1" }))
  await next(user)
}

async function attest(user: Rendered["user"]) {
  await user.click(await screen.findByRole("checkbox", { name: /I made this or may share it/ }))
}

const photo = (name: string) => new File([`bytes of ${name}`], name, { type: "image/jpeg" })

async function toSave(user: Rendered["user"]) {
  await chooseKind(user, /Markdown note/)
  await fillDetails(user)
  await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "Newton")
  await next(user)
  await attest(user)
  await next(user)
}

describe("UploadWizard: steps and validation", () => {
  it("starts with the kind of file and asks for a choice before going on", async () => {
    const { user } = renderWizard()

    expect(screen.getByRole("heading", { level: 2, name: "Kind of file" })).toBeInTheDocument()
    expect(screen.getByTestId("step-progress")).toHaveTextContent("Step 1 of 5: Kind of file")
    for (const name of [/Markdown note/, /PDF file/, /Photos/]) {
      expect(screen.getByRole("radio", { name })).toBeInTheDocument()
    }

    await next(user)

    expect(await screen.findByText("Choose what you are adding.")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Kind of file" })).toBeInTheDocument()
  })

  it("asks for a title, a subject and a year of study, and offers the topics of the chosen subject", async () => {
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)
    expect(await screen.findByRole("heading", { level: 2, name: "About the material" })).toBeInTheDocument()

    await next(user)

    expect(screen.getByText("Write a title.")).toBeInTheDocument()
    expect(screen.getByText("Choose at least one subject.")).toBeInTheDocument()
    expect(screen.getByText("Choose at least one year.")).toBeInTheDocument()

    await user.click(await screen.findByRole("checkbox", { name: "Physics" }))

    const topics = await screen.findByRole("group", { name: "Physics" })
    expect(within(topics).getByRole("checkbox", { name: "Mechanics" })).toBeInTheDocument()
    expect(within(topics).getByRole("checkbox", { name: "Kinematics" })).toBeInTheDocument()
  })

  it("lets the user pick the material types and languages the API knows", async () => {
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)

    await user.selectOptions(await screen.findByLabelText("Type"), "worksheet")
    await user.selectOptions(screen.getByLabelText("Language"), "ru")

    expect(screen.getByLabelText("Type")).toHaveValue("worksheet")
    expect(screen.getByLabelText("Language")).toHaveValue("ru")
    expect(screen.queryByRole("option", { name: "Textbook" })).not.toBeInTheDocument()
  })

  it("needs text for a Markdown note and shows a live preview with a formula", async () => {
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)
    await fillDetails(user)
    expect(await screen.findByRole("heading", { level: 2, name: "Content" })).toBeInTheDocument()

    await next(user)
    expect(screen.getByText("Write some text first.")).toBeInTheDocument()

    await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "## Speed{enter}$v = s / t$")

    const preview = screen.getByRole("region", { name: "Preview of the note" })
    expect(await within(preview).findByRole("heading", { name: "Speed" })).toBeInTheDocument()
    await waitFor(() => expect(preview.querySelector(".katex")).not.toBeNull())
  })

  it("requires the attestation and shows the content policy before the draft is saved", async () => {
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)
    await fillDetails(user)
    await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "Newton")
    await next(user)
    expect(await screen.findByRole("heading", { level: 2, name: "Licence and rules" })).toBeInTheDocument()
    expect(screen.getByText("No answers to current homework.")).toBeInTheDocument()

    await next(user)

    expect(await screen.findByText("Tick the box to confirm.")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Licence and rules" })).toBeInTheDocument()
    // A draft can be saved without the attestation; only Next and Submit need it.
    expect(screen.getByRole("button", { name: "Save as draft" })).toBeInTheDocument()

    await attest(user)
    await next(user)
    expect(await screen.findByRole("heading", { level: 2, name: "Review and submit" })).toBeInTheDocument()
  })

  it("saves a draft without the attestation (attested: false) and cannot be submitted until it is ticked", async () => {
    const bodies: Record<string, unknown>[] = []
    server.use(
      http.post(apiUrl("/v1/library/materials"), async ({ request }) => {
        bodies.push((await request.clone().json()) as Record<string, unknown>)
        return undefined
      }),
    )
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)
    await fillDetails(user)
    await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "Newton")
    await next(user)
    await screen.findByRole("heading", { level: 2, name: "Licence and rules" })

    await user.click(screen.getByRole("button", { name: "Save as draft" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalled())
    expect(bodies[0]).toMatchObject({ attested: false, title: "Kinematics notes" })
    const drafts = await getMyUploads({ status: "draft" })
    expect(drafts.items.map((row) => row.item.title)).toContain("Kinematics notes")
  })

  it("explains a refused submit: the attestation is missing (422 library/attestation-required)", async () => {
    server.use(
      http.post(apiUrl("/v1/library/materials/:id/submit"), () =>
        problem(422, "library/attestation-required", "Confirm that you made the material or may share it"),
      ),
    )
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)
    await fillDetails(user)
    await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "Newton")
    await next(user)
    await attest(user)
    await next(user)
    await screen.findByRole("heading", { level: 2, name: "Review and submit" })

    await user.click(screen.getByRole("button", { name: "Submit" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Confirm the statement first")
    expect(alert).toHaveTextContent("Confirm that you made it or may share it, then submit again.")
  })

  it("offers no Creative Commons licence and no public option to a student", async () => {
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)
    await fillDetails(user)
    await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "Newton")
    await next(user)

    expect(await screen.findByText(/Only lyceum accounts can see it/)).toBeInTheDocument()
    expect(screen.queryByRole("checkbox", { name: /Make it public/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("radio", { name: /CC BY/ })).not.toBeInTheDocument()
  })
})

describe("UploadWizard: submitting", () => {
  it("saves the draft after the attestation, shows the student copy, and sends the material for review", async () => {
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)
    await fillDetails(user)
    await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "Newton's laws")
    await next(user)
    await attest(user)

    await next(user)

    expect(await screen.findByRole("heading", { level: 2, name: "Review and submit" })).toBeInTheDocument()
    expect(screen.getByTestId("submit-note")).toHaveTextContent(
      "A librarian will review it, usually within 2 school days.",
    )
    expect(screen.getByText("Kinematics notes")).toBeInTheDocument()
    expect(screen.getByText("Physics")).toBeInTheDocument()
    const drafts = await getMyUploads({ status: "draft" })
    expect(drafts.items.map((row) => row.item.title)).toContain("Kinematics notes")

    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(await screen.findByText("Sent for review")).toBeInTheDocument()
    const pending = await getMyUploads({ status: "pending_review" })
    expect(pending.items.map((row) => row.item.title)).toContain("Kinematics notes")
    expect(screen.getByRole("link", { name: "My uploads" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/my\/?\?tab=uploads$/),
    )
  })

  it("tells a teacher that the material is published at once, and offers a public licence", async () => {
    const { user } = renderWizard("teacher")
    await chooseKind(user, /Markdown note/)
    await fillDetails(user)
    await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "Newton's laws")
    await next(user)

    expect(screen.queryByRole("radio", { name: /CC BY/ })).not.toBeInTheDocument()
    await user.click(await screen.findByRole("checkbox", { name: /Make it public/ }))
    expect(screen.getByRole("radio", { name: /CC BY-SA/ })).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: /CC BY-SA/ }))
    await attest(user)
    await next(user)

    expect(await screen.findByTestId("submit-note")).toHaveTextContent("It will be published at once.")
    expect(screen.getByText("Public, CC BY-SA")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Submit" }))

    expect(await screen.findByText("Published")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View in the library" })).toBeInTheDocument()
    const published = await getMyUploads({ status: "published" })
    expect(published.items.map((row) => row.item.title)).toContain("Kinematics notes")
  })

  it("saves a draft and leaves for My uploads", async () => {
    const { user } = renderWizard()
    await chooseKind(user, /Markdown note/)
    await fillDetails(user)
    await user.type(screen.getByRole("textbox", { name: "Text of the note (Markdown)" }), "Newton")
    await next(user)
    await attest(user)

    await user.click(screen.getByRole("button", { name: "Save as draft" }))

    await waitFor(() => expect(testRouter.push).toHaveBeenCalledWith("/my/?tab=uploads"))
    const drafts = await getMyUploads({ status: "draft" })
    expect(drafts.items.map((row) => row.item.title)).toContain("Kinematics notes")
  })

  it("sends a PDF through the presigned upload and attaches it", async () => {
    const attached: unknown[] = []
    server.use(
      http.post(apiUrl("/v1/library/materials/:id/files"), async ({ request }) => {
        attached.push(await request.clone().json())
      }),
    )
    const { user } = renderWizard()
    await chooseKind(user, /PDF file/)
    await fillDetails(user)
    expect(await screen.findByRole("heading", { level: 2, name: "Content" })).toBeInTheDocument()

    await next(user)
    expect(screen.getByText("Choose a file.")).toBeInTheDocument()

    fireEvent.change(screen.getByTestId("pdf-input"), {
      target: { files: [new File(["%PDF-1.4"], "kinematics.pdf", { type: "application/pdf" })] },
    })
    expect(screen.getByTestId("chosen-file")).toHaveTextContent("kinematics.pdf")
    await next(user)
    await attest(user)
    await next(user)

    expect(await screen.findByRole("heading", { level: 2, name: "Review and submit" })).toBeInTheDocument()
    expect(attached).toHaveLength(1)
    expect((attached[0] as { file_ids: string[] }).file_ids).toHaveLength(1)
    expect(screen.getByText(/kinematics\.pdf/)).toBeInTheDocument()
  })

  it("warns, but does not block, when a student's file is above 20 MB", async () => {
    const { user } = renderWizard()
    await chooseKind(user, /PDF file/)
    await fillDetails(user)
    const big = new File(["x"], "big.pdf", { type: "application/pdf" })
    Object.defineProperty(big, "size", { value: 30 * 1024 * 1024 })

    fireEvent.change(await screen.findByTestId("pdf-input"), { target: { files: [big] } })

    expect(screen.getByRole("alert")).toHaveTextContent("Larger than 20 MB. The library will probably refuse it.")
    expect(screen.getByText(/PDF, up to 20 MB and 60 pages/)).toBeInTheDocument()
    await next(user)
    expect(await screen.findByRole("heading", { level: 2, name: "Licence and rules" })).toBeInTheDocument()
  })

  it("uploads the photos in the order the user arranged them", async () => {
    const sent: string[] = []
    server.use(
      http.post(apiUrl("/v1/files"), async ({ request }) => {
        sent.push(((await request.clone().json()) as { name: string }).name)
      }),
    )
    const { user } = renderWizard()
    await chooseKind(user, /Photos/)
    await fillDetails(user)
    fireEvent.change(await screen.findByTestId("photo-camera-input"), {
      target: { files: [photo("first.jpg"), photo("second.jpg"), photo("third.jpg")] },
    })
    await user.click(screen.getByRole("button", { name: "Move photo 3 up" }))
    await user.click(screen.getByRole("button", { name: "Move photo 2 up" }))
    await next(user)
    await attest(user)

    await next(user)

    expect(await screen.findByRole("heading", { level: 2, name: "Review and submit" })).toBeInTheDocument()
    expect(sent).toEqual(["third.jpg", "first.jpg", "second.jpg"])
    expect(screen.getByText(/3 photos, combined into one PDF/)).toBeInTheDocument()
  })
})

describe("UploadWizard: blocked and refused uploads", () => {
  it("explains a ban with its end date and offers no retry", async () => {
    server.use(
      http.post(apiUrl("/v1/library/materials"), () =>
        problem(403, "library/banned", "Banned", { params: { until: "2026-12-01T00:00:00Z" } }),
      ),
    )
    const { user } = renderWizard()

    await toSave(user)

    const panel = await screen.findByRole("alert")
    expect(panel).toHaveTextContent("You cannot upload right now")
    expect(panel).toHaveTextContent(/Uploading is blocked until .*2026/)
    expect(within(panel).queryByRole("button", { name: "Try again" })).not.toBeInTheDocument()
    expect(within(panel).getByRole("link", { name: "My uploads" })).toBeInTheDocument()
  })

  it("explains a used-up daily limit with the time it is lifted", async () => {
    server.use(
      http.post(apiUrl("/v1/library/materials"), () =>
        problem(429, "library/rate-limited", "Too many", {
          params: { action: "upload", limit: 10, resets_at: "2026-10-09T00:00:00Z" },
        }),
      ),
    )
    const { user } = renderWizard()

    await toSave(user)

    const panel = await screen.findByRole("alert")
    expect(panel).toHaveTextContent("Upload limit reached")
    expect(panel).toHaveTextContent(/You can upload 10 materials a day\. You can upload again after .*2026/)
    expect(within(panel).getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })

  it("links to the existing item when the file is a duplicate", async () => {
    server.use(
      http.post(apiUrl("/v1/library/materials/:id/files"), () =>
        problem(409, "library/duplicate", "Duplicate", { params: { item_id: "item-77" } }),
      ),
    )
    const { user } = renderWizard()
    await chooseKind(user, /PDF file/)
    await fillDetails(user)
    fireEvent.change(await screen.findByTestId("pdf-input"), {
      target: { files: [new File(["%PDF-1.4"], "same.pdf", { type: "application/pdf" })] },
    })
    await next(user)
    await attest(user)

    await next(user)

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("This file is already in the library")
    expect(within(alert).getByRole("link", { name: "Open the existing item" })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/item\/?\?id=item-77$/),
    )
    expect(screen.getByRole("heading", { level: 2, name: "Licence and rules" })).toBeInTheDocument()
  })

  it("names the size limit when the file is too large and the page limit when it has too many pages", async () => {
    let code = "library/file-too-large"
    server.use(http.post(apiUrl("/v1/library/materials/:id/files"), () => problem(413, code, "Refused")))
    const { user } = renderWizard()
    await chooseKind(user, /PDF file/)
    await fillDetails(user)
    fireEvent.change(await screen.findByTestId("pdf-input"), {
      target: { files: [new File(["%PDF-1.4"], "a.pdf", { type: "application/pdf" })] },
    })
    await next(user)
    await attest(user)
    await next(user)
    expect(await screen.findByRole("alert")).toHaveTextContent("A file can be up to 20 MB")

    code = "library/too-many-pages"
    await next(user)

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("A file can have at most 60 pages"))
  })

  it("shows the reason when the storage check refuses a file", async () => {
    server.use(
      http.post(apiUrl("/v1/files/:id/complete"), () =>
        HttpResponse.json({
          id: "0000000a-0000-4000-8000-0000000000ff",
          name: "fake.pdf",
          content_type: "application/pdf",
          byte_size: 8,
          purpose: "library_material",
          status: "rejected",
          reject_reason: "infected",
          text_bytes: null,
          assistant_ready: false,
          created_at: "2026-10-08T09:00:00Z",
          expires_on: null,
          used_by: [],
        }),
      ),
    )
    const { user } = renderWizard()
    await chooseKind(user, /PDF file/)
    await fillDetails(user)
    fireEvent.change(await screen.findByTestId("pdf-input"), {
      target: { files: [new File(["%PDF-1.4"], "fake.pdf", { type: "application/pdf" })] },
    })
    await next(user)
    await attest(user)

    await next(user)

    expect(await screen.findByRole("alert")).toHaveTextContent("a virus or malware was found")
  })
})

describe("UploadWizard: suggest a book", () => {
  it("links to the book form at /upload/", () => {
    renderWizard()
    expect(screen.getByRole("link", { name: "Suggest a book" }).getAttribute("href")).toMatch(/^\/upload\/?$/)
    expect(screen.queryByRole("dialog", { name: "Suggest a book" })).not.toBeInTheDocument()
  })
})

describe("UploadWizard: accessibility", () => {
  it("has no axe violations on the first two steps", async () => {
    const { container, user } = renderWizard()
    const options = { rules: { "color-contrast": { enabled: false } } }

    expect((await axe.run(container, options)).violations.map((v) => v.id)).toEqual([])

    await chooseKind(user, /Markdown note/)
    await screen.findByRole("checkbox", { name: "Physics" })
    expect((await axe.run(container, options)).violations.map((v) => v.id)).toEqual([])
  })

  it("moves the focus to the heading of the next step", async () => {
    const { user } = renderWizard()

    await chooseKind(user, /PDF file/)

    const heading = await screen.findByRole("heading", { level: 2, name: "About the material" })
    await waitFor(() => expect(heading).toHaveFocus())
  })
})

/** IMS Common Cartridge: the import dialog uploads a file, follows the job and shows the report. */
import { describe, expect, it, setDefaultTimeout } from "bun:test"
import { teacherMe } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import { CopyCourseButton } from "../features/imscc/components/copy-course-button"
import { ImportImsccDialog } from "../features/imscc/components/import-imscc-dialog"
import { renderLms } from "./helpers"

setDefaultTimeout(60_000)

const creator = { user: { ...teacherMe, roles: ["teacher" as const, "lms_creator" as const] } }

describe("import .imscc", () => {
  it("uploads, polls and shows the report with the unsupported items", async () => {
    renderLms(<ImportImsccDialog open onOpenChange={() => undefined} />, { session: creator })

    const input = await screen.findByLabelText("Cartridge file")
    fireEvent.change(input, { target: { files: [new File(["PK"], "algebra.imscc")] } })
    fireEvent.click(screen.getByRole("button", { name: "Import" }))

    expect(await screen.findByRole("progressbar")).toBeInTheDocument()
    expect(await screen.findByText("Imported: Imported algebra", {}, { timeout: 10_000 })).toBeInTheDocument()
    expect(screen.getByText("7 steps")).toBeInTheDocument()
    expect(screen.getByRole("list", { name: "Items not fully imported" })).toHaveTextContent("Discussion 1")
    await waitFor(() => expect(screen.getByRole("button", { name: "Open the course" })).toBeInTheDocument())
  })
})

describe("copy course", () => {
  it("asks first, then copies and links to the new draft", async () => {
    renderLms(<CopyCourseButton courseId="course-1" />, { session: creator })

    fireEvent.click(screen.getByRole("button", { name: "Copy course" }))
    expect(await screen.findByText("Copy this course?")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Copy" }))

    expect(await screen.findByText("Copied: Algebra (copy)")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Open the copy" })).toHaveAttribute(
      "href",
      expect.stringContaining("course-copy"),
    )
  })
})

import { describe, expect, it } from "bun:test"
import { renderWithProviders } from "@ihsp/test-utils"
import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { PhotoField } from "./photo-field"
import { PHOTO_MAX_BYTES, photoProblem } from "./photo-rules"
import { TeacherAvatar } from "./teacher-avatar"

const PHOTO = "https://files.example.test/photos/teacher.jpg"

function pngFile(name = "teacher.png", size = 1024): File {
  return new File([new Uint8Array(size)], name, { type: "image/png" })
}

function renderField(
  overrides: Partial<{
    photoUrl: string | null
    onUpload: (file: File) => Promise<unknown>
    onRemove: () => Promise<unknown>
  }> = {},
) {
  const props = {
    name: "Kalandarova Gavxar",
    photoUrl: null,
    onUpload: async () => ({ photo_url: PHOTO }),
    onRemove: async () => ({ photo_url: null }),
    ...overrides,
  }
  return renderWithProviders(<PhotoField {...props} />)
}

describe("photoProblem", () => {
  it("accepts JPEG and PNG up to 5 MB and refuses other types and larger files", () => {
    expect(photoProblem({ type: "image/jpeg", size: 1000 })).toBeNull()
    expect(photoProblem({ type: "image/png", size: PHOTO_MAX_BYTES })).toBeNull()
    expect(photoProblem({ type: "image/gif", size: 1000 })).toBe("wrongType")
    expect(photoProblem({ type: "application/pdf", size: 1000 })).toBe("wrongType")
    expect(photoProblem({ type: "image/png", size: PHOTO_MAX_BYTES + 1 })).toBe("tooLarge")
  })
})

describe("TeacherAvatar", () => {
  it("shows the photo with the name as alt text, or the initials without one", () => {
    const { unmount } = renderWithProviders(<TeacherAvatar name="Kalandarova Gavxar" photoUrl={PHOTO} />)
    expect(screen.getByRole("img", { name: "Photo of Kalandarova Gavxar" })).toHaveAttribute("src", PHOTO)
    unmount()

    renderWithProviders(<TeacherAvatar name="Kalandarova Gavxar" photoUrl={null} />)
    expect(screen.getByTestId("teacher-avatar")).toHaveTextContent("KG")
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("a decorative avatar has no alt text and is hidden from assistive technology", () => {
    renderWithProviders(<TeacherAvatar name="Kalandarova Gavxar" photoUrl={PHOTO} decorative />)
    expect(screen.getByTestId("teacher-avatar")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByTestId("teacher-avatar").querySelector("img")).toHaveAttribute("alt", "")
  })
})

describe("PhotoField", () => {
  it("shows the current photo and the remove button; without a photo only the upload button", () => {
    const { unmount } = renderField({ photoUrl: PHOTO })
    expect(screen.getByRole("img", { name: "Photo of Kalandarova Gavxar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Replace photo" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove photo" })).toBeInTheDocument()
    unmount()

    renderField({ photoUrl: null })
    expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove photo" })).toBeNull()
    expect(screen.getByTestId("teacher-avatar")).toHaveTextContent("KG")
  })

  it("sends a picked PNG and shows the pending state until the upload is saved", async () => {
    const sent: File[] = []
    const control: { finish?: () => void } = {}
    renderField({
      onUpload: (file) => {
        sent.push(file)
        return new Promise((resolve) => {
          control.finish = () => resolve({ photo_url: PHOTO })
        })
      },
    })

    fireEvent.change(screen.getByLabelText("Photo"), { target: { files: [pngFile()] } })

    expect(await screen.findByRole("status")).toHaveTextContent("Uploading…")
    expect(screen.getByRole("button", { name: "Upload photo" })).toBeDisabled()
    expect(sent.map((file) => file.name)).toEqual(["teacher.png"])

    control.finish?.()
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull())
    expect(screen.getByRole("button", { name: "Upload photo" })).not.toBeDisabled()
  })

  it("refuses a GIF or a file over 5 MB without sending anything", async () => {
    let calls = 0
    renderField({
      onUpload: async () => {
        calls += 1
        return {}
      },
    })
    const input = screen.getByLabelText("Photo")

    fireEvent.change(input, { target: { files: [new File(["x"], "anim.gif", { type: "image/gif" })] } })
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a JPEG or PNG image.")

    const big = new File([new Uint8Array(PHOTO_MAX_BYTES + 1)], "big.jpg", { type: "image/jpeg" })
    fireEvent.change(input, { target: { files: [big] } })
    expect(await screen.findByRole("alert")).toHaveTextContent("The photo is larger than 5 MB.")

    expect(calls).toBe(0)
  })

  it("shows the server's message when the upload is rejected", async () => {
    renderField({
      onUpload: async () => {
        throw Object.assign(new Error("rejected"), { type: "id/photo-type-not-allowed" })
      },
    })

    fireEvent.change(screen.getByLabelText("Photo"), { target: { files: [pngFile()] } })

    expect(await screen.findByRole("alert")).toHaveTextContent("Only JPEG or PNG photos are accepted.")
  })

  it("asks for confirmation before removing the photo and removes it on confirm", async () => {
    let removed = 0
    renderField({
      photoUrl: PHOTO,
      onRemove: async () => {
        removed += 1
        return { photo_url: null }
      },
    })

    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }))
    expect(removed).toBe(0)
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("Remove the photo?")

    fireEvent.click(within(dialog).getByRole("button", { name: "Remove photo" }))

    await waitFor(() => expect(removed).toBe(1))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
  })

  it("keeps the photo when the removal is cancelled", async () => {
    let removed = 0
    renderField({
      photoUrl: PHOTO,
      onRemove: async () => {
        removed += 1
        return { photo_url: null }
      },
    })

    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }))
    const dialog = await screen.findByRole("alertdialog")
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(removed).toBe(0)
    expect(screen.getByRole("img", { name: "Photo of Kalandarova Gavxar" })).toBeInTheDocument()
  })
})

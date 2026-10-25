/** The teacher's own profile photo in settings: upload, refusal of a wrong file, and removal. */
import { describe, expect, test } from "bun:test"
import { teacherPhotoUploads } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { SettingsPage } from "../features/settings/components/settings-page"
import { configureTests, renderStaff } from "./helpers"

configureTests()

describe("teacher's own photo in settings", () => {
  test("uploads a JPEG, shows it, and removes it", async () => {
    const { user } = renderStaff(<SettingsPage />)

    fireEvent.change(await screen.findByLabelText("Photo"), {
      target: { files: [new File([new Uint8Array(4096)], "me.jpg", { type: "image/jpeg" })] },
    })

    expect(await screen.findByRole("img", { name: /^Photo of / })).toBeInTheDocument()
    expect(teacherPhotoUploads()).toEqual([{ owner: "me", name: "me.jpg", type: "image/jpeg", size: 4096 }])

    await user.click(screen.getByRole("button", { name: "Remove photo" }))
    const confirm = await screen.findByRole("alertdialog")
    await user.click(within(confirm).getByRole("button", { name: "Remove photo" }))

    expect(await screen.findByRole("button", { name: "Upload photo" })).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: /^Photo of / })).toBeNull()
  })

  test("a GIF is refused on the device and nothing is sent", async () => {
    renderStaff(<SettingsPage />)

    fireEvent.change(await screen.findByLabelText("Photo"), {
      target: { files: [new File(["GIF89a"], "me.gif", { type: "image/gif" })] },
    })

    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a JPEG or PNG image.")
    expect(teacherPhotoUploads()).toEqual([])
  })
})

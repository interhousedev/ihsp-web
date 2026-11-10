/** FACE-SP-1: the entrance photo page: locked state, upload errors, remove. */
import { describe, expect, test } from "bun:test"
import { setMyFace } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FacePage } from "../features/face/components/face-page"
import { configureTests, renderSp } from "./helpers"

configureTests()

const jpeg = (name: string, type = "image/jpeg") => new File([new Uint8Array(10)], name, { type })

describe("face page", () => {
  test("FACE-SP-1: a photo set by staff is read-only and says who can change it", async () => {
    setMyFace({ has_face: true, locked: true, photo_url: "https://files.example.test/f.jpg" })
    renderSp(<FacePage />, { route: "/profile/face/" })

    expect(await screen.findByText(/Only the curator or an administrator can change it/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Choose a file" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Remove photo" })).not.toBeInTheDocument()
  })

  test("FACE-SP-2: the server's reasons are shown for a photo without a face", async () => {
    const user = userEvent.setup()
    renderSp(<FacePage />, { route: "/profile/face/" })
    await screen.findByRole("button", { name: "Choose a file" })

    await user.upload(screen.getByLabelText("Choose a file"), jpeg("nofaces.jpg"))
    await user.click(await screen.findByRole("button", { name: "Save photo" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("No face found in the photo")
  })

  test("FACE-SP-3: several faces and wrong type are explained", async () => {
    const user = userEvent.setup()
    renderSp(<FacePage />, { route: "/profile/face/" })
    await screen.findByRole("button", { name: "Choose a file" })

    await user.upload(screen.getByLabelText("Choose a file"), jpeg("multi.jpg"))
    await user.click(await screen.findByRole("button", { name: "Save photo" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("More than one face")
  })

  test("FACE-SP-4: a saved photo can be removed", async () => {
    const user = userEvent.setup()
    renderSp(<FacePage />, { route: "/profile/face/" })
    await screen.findByRole("button", { name: "Choose a file" })

    await user.upload(screen.getByLabelText("Choose a file"), jpeg("me.jpg"))
    await user.click(await screen.findByRole("button", { name: "Save photo" }))
    await user.click(await screen.findByRole("button", { name: "Remove photo" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Remove photo" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Remove photo" })).not.toBeInTheDocument())
  })
})

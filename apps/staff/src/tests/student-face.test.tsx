/** FACE-STF-1: the curator uploads, replaces and deletes a student's entrance photo. */
import { describe, expect, test } from "bun:test"
import { screen, waitFor, within } from "@testing-library/react"
import { StudentsPage } from "../features/group/components/students-page"
import { configureTests, renderStaff } from "./helpers"

configureTests()

const file = (name: string) => new File([new Uint8Array(10)], name, { type: "image/jpeg" })

async function openCard() {
  const view = renderStaff(<StudentsPage />)
  await view.user.click(await screen.findByRole("button", { name: /Qodirov Sardor/ }))
  return { ...view, card: await screen.findByRole("dialog") }
}

describe("student entrance photo", () => {
  test("FACE-STF-1: uploads a photo, then deletes it after confirmation", async () => {
    const { user, card } = await openCard()

    await user.upload(within(card).getByLabelText("Choose a file"), file("a.jpg"))
    await user.click(await within(card).findByRole("button", { name: "Save photo" }))
    expect(await within(card).findByRole("img", { name: /Entrance photo of Qodirov Sardor/ })).toBeInTheDocument()

    await user.click(within(card).getByRole("button", { name: "Remove photo" }))
    const confirm = await screen.findByRole("alertdialog")
    await user.click(within(confirm).getByRole("button", { name: "Remove photo" }))
    await waitFor(() => expect(within(card).queryByRole("img", { name: /Entrance photo/ })).not.toBeInTheDocument())
  })

  test("FACE-STF-2: a photo without a face shows the reason", async () => {
    const { user, card } = await openCard()

    await user.upload(within(card).getByLabelText("Choose a file"), file("nofaces.jpg"))
    await user.click(await within(card).findByRole("button", { name: "Save photo" }))

    expect(await within(card).findByRole("alert")).toHaveTextContent("No face found in the photo")
  })
})

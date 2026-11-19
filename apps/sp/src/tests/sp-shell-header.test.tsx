/** SP-UX-a1, SP-UX-a2: the home header shows who is signed in, with a photo or initials. */
import { describe, expect, test } from "bun:test"
import { userMe } from "@ihsp/test-utils"
import { fireEvent, screen, within } from "@testing-library/react"
import { HomeHeader } from "../features/dashboard/components/home-header"
import { fullName } from "../features/shared/utils/people"
import { configureTests, renderSp } from "./helpers"

configureTests()

const PHOTO = "https://files.example.test/me.jpg"
const withPhoto = { user: { ...userMe, photo_url: PHOTO, has_photo: false } }

describe("home header", () => {
  test("SP-UX-a1: shows the full name, last name first, and the session photo although has_photo is false", async () => {
    renderSp(<HomeHeader />, { session: withPhoto })

    const header = screen.getByTestId("home-header")
    const name = fullName(userMe)
    expect(within(header).getByTestId("home-header-name")).toHaveTextContent(name)
    const link = within(header).getByRole("link", { name: new RegExp(name) })
    expect(link).toHaveAccessibleName(/open profile/i)
    expect(header.querySelector("img")?.getAttribute("src")).toBe(PHOTO)
  })

  test("SP-UX-a2: a photo that fails to load falls back to the initials", async () => {
    renderSp(<HomeHeader />, { session: withPhoto })

    const header = screen.getByTestId("home-header")
    const img = header.querySelector("img")
    expect(img).not.toBeNull()
    fireEvent.error(img as HTMLImageElement)

    expect(header.querySelector("img")).toBeNull()
    expect(within(header).getByTestId("teacher-avatar-initials").textContent?.trim()).not.toBe("")
  })
})

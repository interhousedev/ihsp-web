/** The profile photo for every role: the header shows name and avatar, upload and removal reach the server. */
import { describe, expect, test } from "bun:test"
import { useAuthStore } from "@ihsp/auth"
import { apiUrl, server, userMe } from "@ihsp/test-utils"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { ProfilePage } from "../features/profile/components/profile-page"
import { ProfileMenu } from "../features/shell/components/profile-menu"
import { configureTests, renderSp } from "./helpers"

configureTests()

const PHOTO = "https://files.example.test/me.jpg"
const png = () => new File([new Uint8Array(10)], "me.png", { type: "image/png" })

describe("profile photo", () => {
  test("the header shows the display name and the photo from the session user", async () => {
    server.use(http.get(apiUrl("/v1/id/me"), () => HttpResponse.json({ ...userMe, photo_url: PHOTO })))
    renderSp(<ProfileMenu />, { route: "/", session: { user: { ...userMe, photo_url: PHOTO } } })

    expect(await screen.findByTestId("header-name")).toHaveTextContent("Brastilov Aleksey")
    expect(useAuthStore.getState().user?.photo_url).toBe(PHOTO)
  })

  test("the header avatar falls back to the initials without a photo", async () => {
    renderSp(<ProfileMenu />, { route: "/", session: { user: { ...userMe, photo_url: null } } })

    expect(await screen.findByRole("button", { name: "Account menu" })).toHaveTextContent("BA")
  })

  test("an upload is sent to PUT /v1/me/photo and the new photo reaches the session", async () => {
    const user = userEvent.setup()
    const uploads: string[] = []
    let current: string | null = null
    server.use(
      http.put(apiUrl("/v1/me/photo"), async ({ request }) => {
        const file = (await request.formData()).get("file")
        uploads.push(file instanceof File ? file.type : "none")
        current = PHOTO
        return HttpResponse.json({ photo_url: PHOTO })
      }),
      http.get(apiUrl("/v1/id/me"), () => HttpResponse.json({ ...userMe, photo_url: current })),
    )
    renderSp(<ProfilePage />, { route: "/profile/", session: { user: { ...userMe, photo_url: null } } })

    await user.upload(await screen.findByLabelText("Photo"), png())

    await waitFor(() => expect(uploads).toEqual(["image/png"]))
    await waitFor(() => expect(useAuthStore.getState().user?.photo_url).toBe(PHOTO))
  })

  test("a removal is sent to DELETE /v1/me/photo and the header goes back to the initials", async () => {
    const user = userEvent.setup()
    let deleted = 0
    server.use(
      http.delete(apiUrl("/v1/me/photo"), () => {
        deleted += 1
        return HttpResponse.json({ photo_url: null })
      }),
      http.get(apiUrl("/v1/id/me"), () => HttpResponse.json({ ...userMe, photo_url: deleted ? null : PHOTO })),
    )
    renderSp(<ProfilePage />, { route: "/profile/", session: { user: { ...userMe, photo_url: PHOTO } } })

    await user.click(await screen.findByRole("button", { name: "Remove photo" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Remove photo" }))

    await waitFor(() => expect(deleted).toBe(1))
    await waitFor(() => expect(useAuthStore.getState().user?.photo_url).toBeNull())
  })
})

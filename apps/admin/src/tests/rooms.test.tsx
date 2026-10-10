/** ADM-19, ROOM-6, ROOM-7, UF-ADM-16: rooms with link and PIN, regenerate PIN with confirmation, merge, archive. */
import { describe, expect, test } from "bun:test"
import { apiUrl, rooms, server } from "@ihsp/test-utils"
import { screen, within } from "@testing-library/react"
import { HttpResponse, http } from "msw"
import { RoomsPage } from "../features/rooms/components/rooms-page"
import { configureTests, renderAdmin, waitUntil } from "./helpers"

configureTests()

describe("rooms page", () => {
  test("shows each room with its link, PIN and lessons this week", async () => {
    renderAdmin(<RoomsPage />, { route: "/rooms/" })

    expect(await screen.findByText("4821")).toBeInTheDocument()
    expect(screen.getByText("7305")).toBeInTheDocument()
    expect(screen.getByText("http://localhost:8000/r/101")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Copy PIN" })).toHaveLength(rooms.length)
  })

  test("regenerating a PIN asks for confirmation first and then calls the API", async () => {
    let regenerated = null as string | null
    server.use(
      http.post(apiUrl("/v1/admin/rooms/:id/regenerate-pin"), ({ params }) => {
        regenerated = String(params.id)
        return HttpResponse.json({ ...rooms[0], pin: "9027" })
      }),
    )
    const { user } = renderAdmin(<RoomsPage />, { route: "/rooms/" })
    await screen.findByText("4821")

    await user.click(screen.getByRole("button", { name: "Regenerate the PIN of room 101" }))

    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText(/The old PIN and bookmarks stop working at once/)).toBeInTheDocument()
    expect(regenerated).toBeNull()

    await user.click(within(dialog).getByRole("button", { name: "Regenerate PIN" }))
    await waitUntil(() => regenerated !== null, "no request")
    expect(regenerated).toBe(rooms[0]?.id ?? null)
  })

  test("cancelling the confirmation keeps the PIN", async () => {
    let called = false
    server.use(
      http.post(apiUrl("/v1/admin/rooms/:id/regenerate-pin"), () => {
        called = true
        return HttpResponse.json(rooms[0])
      }),
    )
    const { user } = renderAdmin(<RoomsPage />, { route: "/rooms/" })
    await screen.findByText("4821")

    await user.click(screen.getByRole("button", { name: "Regenerate the PIN of room 101" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))

    await waitUntil(() => screen.queryByRole("alertdialog") === null, "dialog still open")
    expect(called).toBe(false)
  })

  test("merging sends the target room", async () => {
    let body: unknown
    server.use(
      http.post(apiUrl("/v1/admin/rooms/:id/merge"), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(rooms[1])
      }),
    )
    const { user } = renderAdmin(<RoomsPage />, { route: "/rooms/" })
    await screen.findByText("4821")

    await user.click(screen.getByRole("button", { name: "Merge room 101 into another room" }))
    const dialog = await screen.findByRole("dialog")
    await user.selectOptions(within(dialog).getByLabelText(/Merge into/), rooms[1]?.id ?? "")
    await user.click(within(dialog).getByRole("button", { name: "Merge" }))

    await waitUntil(() => body !== undefined, "no request")
    expect(body).toEqual({ into_room_id: rooms[1]?.id })
  })
})

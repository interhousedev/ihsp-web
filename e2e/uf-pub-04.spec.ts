/**
 * UF-PUB-04: the room page. Administration sees the link and PIN of a room (and can regenerate the PIN); anyone with
 * the link and the PIN sees the room's lessons for the day. The page is plain HTML served by the backend.
 */

import type { Room } from "@ihsp/api"
import { ADMIN } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading, toast } from "./fixtures/ui"

test("UF-PUB-04 the room page needs the PIN; regenerating the PIN invalidates the old one", async ({
  page,
  newGuardedContext,
  allowConsoleError,
}, testInfo) => {
  test.slow()
  allowConsoleError(/status of (403|429)/)
  await loginAs(page, ADMIN, "admin", { path: "/rooms/" })
  await expect(heading(page, "Rooms", 1)).toBeVisible()
  await a11y(page, testInfo, { label: "admin rooms" })

  const rooms = await api<Room[]>(page, "GET", "/v1/admin/rooms?status=active")
  const room = rooms.find((item) => item.name === "102") ?? rooms[0]
  test.skip(!room, "the seed has no rooms")
  if (!room) return

  // The admin list shows the room, its link and its PIN.
  await expect(page.getByText(room.pin).first()).toBeVisible()

  // A visitor without the PIN gets the PIN form; with the PIN the lessons of the room.
  const visitor = await (await newGuardedContext()).newPage()
  const form = await visitor.goto(`${URLS.rooms}/${room.slug}`)
  expect(form?.status()).toBe(200)
  await expect(visitor.locator("input[name=pin]")).toBeVisible()
  await a11y(visitor, testInfo, { label: "room pin form" })

  const opened = await visitor.goto(`${URLS.rooms}/${room.slug}?pin=${room.pin}`)
  expect(opened?.status()).toBe(200)
  expect(opened?.headers()["x-robots-tag"]).toContain("noindex")
  expect(opened?.headers()["referrer-policy"]).toBe("no-referrer")
  expect(opened?.headers()["cache-control"]).toContain("no-store")
  await expect(visitor.locator("body")).toContainText(room.name)
  await a11y(visitor, testInfo, { label: "room page" })

  // Administration regenerates the PIN (after a confirmation); the old PIN stops working at once.
  await page.getByRole("button", { name: `Regenerate the PIN of room ${room.name}` }).click()
  const confirm = page.getByRole("alertdialog")
  await expect(confirm).toContainText("The old PIN and existing bookmarks stop working at once.")
  await confirm.getByRole("button", { name: "Regenerate PIN" }).click()
  await expect(toast(page, "New PIN created")).toBeVisible()
  const after = (await api<Room[]>(page, "GET", "/v1/admin/rooms?status=active")).find((item) => item.id === room.id)
  expect(after?.pin).toBeTruthy()
  expect(after?.pin).not.toBe(room.pin)

  const stale = await visitor.goto(`${URLS.rooms}/${room.slug}?pin=${room.pin}`)
  expect(stale?.status(), "the old PIN is refused").toBe(403)
  await expect(visitor.locator("input[name=pin]")).toBeVisible()
  const fresh = await visitor.goto(`${URLS.rooms}/${room.slug}?pin=${after?.pin ?? ""}`)
  expect(fresh?.status(), "the new PIN works").toBe(200)
  await expect(visitor.locator("body")).toContainText(room.name)
})

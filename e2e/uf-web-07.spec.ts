/**
 * UF-WEB-07: a student attaches a file to a lesson. The browser asks the backend for a presigned URL, uploads the bytes
 * straight to object storage (RustFS in the dev stack), the backend verifies the file, and the lesson lists it.
 */

import type { FileCreateResponse, FileItem, FileUrlResponse } from "@ihsp/api"
import { STUDENT } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { studentLessons } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { pngFile, textFile } from "./fixtures/files"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"

test("UF-WEB-07 upload an attachment to a lesson through a presigned URL", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")

  // Students may attach files to lessons from 7 days back to 14 days ahead.
  const lessons = await studentLessons(page, 0, 14)
  const lesson = lessons[0]
  test.skip(!lesson, "no lesson in the next two weeks (check the seeded timetable and term dates)")
  if (!lesson) return

  await page.goto(`${URLS.sp}/lessons/view/?id=${lesson.id}`)
  await expect(page.getByRole("button", { name: "Add attachment" })).toBeVisible()
  await a11y(page, testInfo, { label: "sp lesson" })
  await page.getByRole("button", { name: "Add attachment" }).click()
  const dialog = page.getByRole("dialog", { name: "Add attachment" })
  await expect(dialog).toBeVisible()

  const upload = pngFile(`e2e-diagram-${Date.now()}.png`)
  const created = page.waitForResponse(
    (response) => response.url() === `${URLS.api}/v1/files` && response.request().method() === "POST",
  )
  const stored = page.waitForResponse(
    (response) => response.url().startsWith(URLS.storage) && response.request().method() === "PUT",
  )
  await dialog.getByTestId("file-upload-input").setInputFiles(upload)

  const file = ((await (await created).json()) as FileCreateResponse).file
  expect((await stored).ok(), "the presigned PUT to object storage succeeded").toBe(true)

  // The backend verifies the upload (size, checksum, real type) after `POST /v1/files/{id}/complete`.
  await expect
    .poll(async () => (await api<FileItem>(page, "GET", `/v1/files/${file.id}`)).status, { timeout: 45_000 })
    .toBe("ready")

  // The lesson lists the attachment (with a delete button for its author).
  await expect(page.getByRole("button", { name: `Delete ${upload.name}` })).toBeVisible({ timeout: 45_000 })
  if (await dialog.isVisible()) await page.keyboard.press("Escape")

  // The stored bytes are the ones that were uploaded.
  const target = await api<FileUrlResponse>(page, "GET", `/v1/files/${file.id}/url?disposition=attachment`)
  const downloaded = Buffer.from(await (await fetch(target.url)).arrayBuffer())
  expect(downloaded.equals(upload.buffer)).toBe(true)

  // It is listed on the lesson after a reload, and the author can remove it again.
  await page.reload()
  await expect(page.getByText(upload.name).first()).toBeVisible()
  await page.getByRole("button", { name: `Delete ${upload.name}` }).click()
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete", exact: true }).click()
  await expect(page.getByText(upload.name)).toHaveCount(0)
  await api(page, "DELETE", `/v1/files/${file.id}`).catch(() => undefined)
})

test("UF-WEB-07 a rejected upload shows the reason", async ({ page }) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  const lesson = (await studentLessons(page, 0, 14))[0]
  test.skip(!lesson, "no lesson in the next two weeks")
  if (!lesson) return
  await page.goto(`${URLS.sp}/lessons/view/?id=${lesson.id}`)
  await page.getByRole("button", { name: "Add attachment" }).click()
  const dialog = page.getByRole("dialog", { name: "Add attachment" })

  // A .pdf that is plain text: the backend sniffs the real type and rejects the file after the upload.
  const fake = textFile(`e2e-not-a-pdf-${Date.now()}.pdf`, "this is not a pdf")
  await dialog.getByTestId("file-upload-input").setInputFiles({ ...fake, mimeType: "application/pdf" })
  await expect(
    dialog
      .getByRole("alert")
      .or(dialog.getByText(/not allowed|rejected|does not match|could not/i))
      .first(),
  ).toBeVisible({
    timeout: 45_000,
  })
})

/**
 * The book editor of the library (a librarian): a new book gets its authors and its topics (the tags of a book, chosen
 * with its subject), is created, and an author is removed and another added; the saved list is still there after a
 * reload. Books have no hard delete (they are withdrawn for the audit), so the draft stays in the library admin list.
 */

import { LIBRARIAN } from "./fixtures/accounts"
import { unique } from "./fixtures/data"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading, toast } from "./fixtures/ui"

test("book editor: authors and topics of a new book are saved and listed again", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, LIBRARIAN, "library", { path: "/manage/books/" })
  await expect(heading(page, "Books", 1)).toBeVisible()
  await page.getByRole("link", { name: "New book", exact: true }).first().click()
  await expect(page).toHaveURL(new RegExp(`${URLS.library}/manage/books/edit/`))
  await expect(heading(page, "New book", 1)).toBeVisible()

  const title = unique("E2E book")
  await page.getByLabel(/^Title/).fill(title)
  const authors = page.getByLabel(/^Authors/)
  await authors.fill("E2E Author")
  await authors.press("Enter")
  await authors.fill("E2E Second Author")
  await authors.press("Enter")
  const list = page.getByRole("list", { name: "Authors" })
  await expect(list.getByText("E2E Author", { exact: true })).toBeVisible()
  await expect(list.getByText("E2E Second Author", { exact: true })).toBeVisible()

  // Topics belong to a subject: add a subject, then a topic of that subject.
  await page.getByRole("button", { name: "Add subject", exact: true }).click()
  await expect(page.getByLabel("Subject", { exact: true }).first()).toHaveValue(/.+/)
  await page.getByRole("button", { name: "Add topic", exact: true }).click()
  await expect(page.getByLabel("Topic", { exact: true }).first()).toHaveValue(/.+/)
  await a11y(page, testInfo, { label: "library book editor new" })

  // Create the book; the address moves to the book.
  await page.getByRole("button", { name: "Create book", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`${URLS.library}/manage/books/edit/\\?id=`), { timeout: 30_000 })

  // Remove the first author, add a third one and save.
  await page.getByRole("button", { name: "Remove E2E Author", exact: true }).click()
  await authors.fill("E2E Third Author")
  await authors.press("Enter")
  await page.getByRole("button", { name: "Save", exact: true }).click()
  await expect(toast(page, "The book was saved.")).toBeVisible()

  // After a reload the authors and the topic are the saved ones.
  await page.reload()
  const saved = page.getByRole("list", { name: "Authors" })
  await expect(saved.getByText("E2E Third Author", { exact: true })).toBeVisible()
  await expect(saved.getByText("E2E Second Author", { exact: true })).toBeVisible()
  await expect(saved.getByText("E2E Author", { exact: true })).toHaveCount(0)
  await expect(page.getByLabel("Topic", { exact: true }).first()).toHaveValue(/.+/)
  await a11y(page, testInfo, { label: "library book editor saved" })
})

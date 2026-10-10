/**
 * Notebook additions: the web-search switch of the chat, Discover (new sources from the internet), the title search,
 * auto-label by topic, mind map editing with "Tidy up", a public share link of a Studio output (read-only for a
 * visitor) and the native download.
 * The backend runs with `OPENROUTER__MODE=fake`; test notebooks are created through the API and removed afterwards.
 */

import { STUDENT } from "./fixtures/accounts"
import { api } from "./fixtures/api"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import {
  HISTORY,
  PHOTOSYNTHESIS,
  addText,
  createNotebook,
  generateTile,
  openNotebook,
  removeNotebook,
  sourcesReady,
  studioItems,
} from "./fixtures/notebooks"
import { expect, test } from "./fixtures/test"

function unique(label: string): string {
  return `${label} ${Date.now()}`
}

test("NB web search switch of the chat toggles and is announced", async ({ page }) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E web"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id, "&tab=chat")

    const toggle = page.getByRole("button", { name: "Search the web too" })
    test.skip((await toggle.count()) === 0, "web search is switched off on this backend")
    await expect(toggle).toHaveAttribute("aria-pressed", "false")
    await toggle.click()
    await expect(toggle).toHaveAttribute("aria-pressed", "true")
    await expect(page.getByRole("button", { name: "Turn off web search" })).toBeVisible()
    await page.getByRole("button", { name: "Turn off web search" }).click()
    await expect(toggle).toHaveAttribute("aria-pressed", "false")
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

test("NB Discover finds web pages and lists them to add", async ({ page }) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E discover"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id)

    const form = page.getByRole("search", { name: "Find new sources on the internet" })
    test.skip((await form.count()) === 0, "Discover is not available on this backend")
    const query = "photosynthesis light reactions"
    await form.getByRole("textbox", { name: "Find new sources on the internet" }).fill(query)
    await form.getByLabel("Search type").selectOption("fast")
    await form.getByRole("button", { name: "Search the web" }).click()

    await expect(page.getByText(`Results for «${query}»`)).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole("button", { name: "Select all" })).toBeVisible()
    await page.getByRole("button", { name: "Select all" }).click()
    await expect(page.getByRole("button", { name: /^Add \d+ sources?$/ })).toBeEnabled()
    await page.getByRole("button", { name: "Back to sources" }).click()
    await expect(page.getByRole("region", { name: "Sources" })).toBeVisible()
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

test("NB search sources by title and auto-label them by topic", async ({ page }) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E labels"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await addText(page, notebook.id, "History notes", HISTORY)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id)
    const sources = page.getByRole("region", { name: "Sources" })

    // Title search narrows the list; clearing it brings everything back.
    const search = sources.getByRole("searchbox", { name: "Search sources" }).or(sources.getByLabel("Search sources"))
    await search.first().fill("History")
    await expect(sources.getByText("History notes")).toBeVisible()
    await expect(sources.getByText("Biology notes")).toHaveCount(0)
    await sources.getByRole("button", { name: "Clear search" }).click()
    await expect(sources.getByText("Biology notes")).toBeVisible()

    // Auto-label groups the selected sources under topic labels.
    await sources.getByRole("button", { name: "Label sources by topic" }).click()
    await expect
      .poll(
        async () => {
          const list = await api<{ label?: string | null }[]>(page, "GET", `/v1/notebooks/${notebook.id}/sources`)
          return list.some((source) => Boolean(source.label))
        },
        { timeout: 60_000, intervals: [1000, 2000] },
      )
      .toBe(true)
    await expect(sources.getByRole("button", { name: "Label sources by topic" })).toBeEnabled({ timeout: 60_000 })
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

test("NB mind map: edit nodes and tidy up", async ({ page }) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E map edit"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id)

    await generateTile(page, "Mind map")
    await studioItems(page).first().getByRole("button").first().click()
    const tree = page.getByRole("tree").first()
    await expect(tree).toBeVisible()
    const nodes = tree.getByRole("treeitem")
    const before = await nodes.count()

    // A node gets a child with a new text.
    await nodes.first().click()
    await page.getByRole("button", { name: "Add child" }).click()
    const label = page.getByRole("textbox", { name: "Node text" })
    await expect(label).toBeVisible()
    const text = unique("Chloroplast")
    await label.fill(text)
    await label.press("Enter")
    await expect(tree.getByText(text).first()).toBeVisible()
    expect(await nodes.count()).toBeGreaterThanOrEqual(before)

    // Rename it, then tidy the map up.
    await tree.getByText(text).first().click()
    await page.getByRole("button", { name: "Edit", exact: true }).click()
    await page.getByRole("textbox", { name: "Node text" }).fill(`${text} edited`)
    await page.getByRole("textbox", { name: "Node text" }).press("Enter")
    await expect(tree.getByText(`${text} edited`).first()).toBeVisible()

    await page.getByRole("button", { name: "More actions" }).first().click()
    await page.getByRole("menuitem", { name: "Tidy up" }).click()
    await expect(tree.getByText(`${text} edited`).first()).toBeVisible()
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

test("NB share a Studio output: a visitor sees it read-only, the owner downloads the file", async ({
  page,
  newGuardedContext,
}) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E share"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id)
    await generateTile(page, "Conspect")
    const menu = studioItems(page)
      .first()
      .getByRole("button", { name: /^Actions for/ })

    // Share: the link is created by `POST /v1/shares`; a visitor without a session opens it.
    await menu.click()
    const created = page.waitForResponse(
      (response) => response.url() === `${URLS.api}/v1/shares` && response.request().method() === "POST",
    )
    await page.getByRole("menuitem", { name: "Share", exact: true }).click()
    const link = (await (await created).json()) as { url: string }
    expect(link.url).toContain("/ai/")

    const visitorContext = await newGuardedContext()
    const visitor = await visitorContext.newPage()
    await visitor.goto(link.url)
    await expect(visitor.getByText("Shared publicly")).toBeVisible({ timeout: 30_000 })
    await expect(visitor.getByRole("button", { name: /Add as source|Add to my files|Share/ })).toHaveCount(0)
    await expect(visitor.getByRole("textbox")).toHaveCount(0)

    // Download: the native Office file of the output.
    await menu.click()
    const download = page.waitForEvent("download")
    await page
      .getByRole("menuitem", { name: /^Download \./ })
      .first()
      .click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/\.(docx|xlsx|pptx|md|csv|png)$/)
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

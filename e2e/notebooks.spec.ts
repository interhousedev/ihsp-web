/**
 * Notebooks (NB-1 to NB-20, WEB-31 to WEB-36), docs/reference/notebooklm.md § 6.3 E2E: a notebook is built from pasted
 * text, chat answers carry citation chips that open the source at the passage, Studio makes a conspect, a quiz, flash
 * cards and a mind map, a phone gets tabs and a citation sheet, and the daily quota disables the tiles.
 * The backend runs with `OPENROUTER__MODE=fake`: a chat answer is `(fake) <first 100 characters of S1:P1> [[S1:P1]]`
 * and every generation finishes within seconds. Test data is created through the API and removed afterwards.
 */

import type { ArtifactItem, NotebookDetail, SourceItem, FlashcardSetItem } from "@ihsp/api"
import type { Page } from "@playwright/test"
import { STUDENT } from "./fixtures/accounts"
import { ApiCallError, api } from "./fixtures/api"
import { URLS } from "./fixtures/env"
import { loginAs } from "./fixtures/login"
import { a11y, expect, test } from "./fixtures/test"
import { heading } from "./fixtures/ui"

const PHOTOSYNTHESIS = [
  "Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose.",
  "The Calvin cycle takes place in the stroma of the chloroplast and builds sugar from carbon dioxide.",
  "The light reactions take place in the thylakoid membranes where water is split and oxygen is released.",
].join("\n\n")

const HISTORY = [
  "The Khiva Khanate became a Russian protectorate in 1873 after the treaty of Gandemian.",
  "The Bukhara Emirate had signed a similar treaty in 1868 and kept its internal self-government.",
].join("\n\n")

function unique(label: string): string {
  return `${label} ${Date.now()}`
}

async function createNotebook(page: Page, title: string): Promise<NotebookDetail> {
  return api<NotebookDetail>(page, "POST", "/v1/notebooks", { title })
}

async function addText(page: Page, notebookId: string, title: string, text: string): Promise<SourceItem> {
  const result = await api<{ items: SourceItem[] }>(page, "POST", `/v1/notebooks/${notebookId}/sources`, {
    items: [{ kind: "text", title, text }],
  })
  return result.items[0] as SourceItem
}

/** Polls the sources until none is pending or processing (the worker reads them in the background). */
async function sourcesReady(page: Page, notebookId: string): Promise<SourceItem[]> {
  let sources: SourceItem[] = []
  await expect
    .poll(
      async () => {
        sources = await api<SourceItem[]>(page, "GET", `/v1/notebooks/${notebookId}/sources`)
        return sources.every((source) => source.status === "ready")
      },
      { timeout: 60_000, intervals: [500, 1000, 2000] },
    )
    .toBe(true)
  return sources
}

async function removeNotebook(page: Page, notebookId: string): Promise<void> {
  await api(page, "DELETE", `/v1/notebooks/${notebookId}`).catch(() => undefined)
}

/** Opens the workspace of a notebook; the first authorized call also gives the helpers their token. */
async function openNotebook(page: Page, notebookId: string, query = ""): Promise<void> {
  await page.goto(`${URLS.sp}/notebooks/view/?id=${notebookId}${query}`)
  await expect(page.getByRole("region", { name: "Sources" })).toBeVisible()
}

async function ask(page: Page, text: string): Promise<void> {
  await page.getByRole("textbox", { name: "Message" }).fill(text)
  await page.getByRole("button", { name: "Send" }).click()
}

/** The Studio tile button (its pencil has the name "Customize <kind>"). */
function tile(page: Page, name: string) {
  return page.getByRole("list", { name: "Create study materials" }).getByRole("button", { name, exact: true })
}

function studioItems(page: Page) {
  return page.getByRole("list", { name: "Studio items" }).getByRole("listitem")
}

/** Starts a tile and waits until the newest Studio item is ready; returns after opening it. */
async function generateAndOpen(page: Page, tileName: string): Promise<void> {
  await tile(page, tileName).click()
  await expect(studioItems(page).first()).toBeVisible()
  // Ready items are buttons; a generating one is plain text with a spinner.
  await expect(studioItems(page).first().getByRole("button").first()).toBeVisible({ timeout: 90_000 })
  await studioItems(page).first().getByRole("button").first().click()
}

test("NB-6 create a notebook, paste text, ask, follow a citation to the highlighted passage", async ({
  page,
}, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  await expect(heading(page, "Notebooks", 1)).toBeVisible()
  await a11y(page, testInfo, { label: "sp notebooks list" })

  // 1. A new notebook opens at once with the Add sources dialog.
  await page.getByRole("button", { name: "New notebook" }).first().click()
  await expect(page).toHaveURL(new RegExp(`${URLS.sp}/notebooks/view/\\?id=`))
  const notebookId = new URL(page.url()).searchParams.get("id") ?? ""
  const title = unique("E2E biology")
  try {
    const dialog = page.getByRole("dialog", { name: "Add sources" })
    await expect(dialog).toBeVisible()
    await dialog.getByRole("tab", { name: "Text" }).click()
    await dialog.getByLabel("Title").fill(title)
    await dialog.getByLabel("Paste text here").first().fill(PHOTOSYNTHESIS)
    await a11y(page, testInfo, { label: "sp add sources dialog" })
    await dialog.getByRole("button", { name: "Add text" }).click()
    await expect(dialog).toBeHidden()

    // 2. The source is read in the background and shows in the list.
    const sources = page.getByRole("region", { name: "Sources" })
    await expect(sources.getByText(title)).toBeVisible()
    await expect(sources.getByText("Reading…")).toBeHidden({ timeout: 60_000 })
    await sourcesReady(page, notebookId)
    await a11y(page, testInfo, { label: "sp notebook workspace" })

    // 3. A grounded question gets an answer with a citation chip.
    await ask(page, "What is the Calvin cycle?")
    const chip = page.getByRole("button", { name: new RegExp(`^Source 1: ${title}`) }).first()
    await expect(chip).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(/\(fake\)/).first()).toBeVisible()

    // 4. The chip opens the source at the cited passage, highlighted.
    await chip.click()
    await expect(page).toHaveURL(/passage=/)
    await expect(page.locator('[data-highlighted="true"]').first()).toBeVisible()
    await a11y(page, testInfo, { label: "sp source viewer" })
    await page.getByRole("button", { name: "Back to chat" }).first().click()
    await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible()
  } finally {
    await removeNotebook(page, notebookId)
  }
})

test("NB-5 deselected sources are not used for the answer", async ({ page }) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E selection"))
  try {
    const biology = await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    const history = await addText(page, notebook.id, "History notes", HISTORY)
    // A chat of the student is a source as well (the assistant chat made on the fly).
    const chat = await api<{ id: string }>(page, "POST", "/v1/ai/chats", { assistant: "student" })
    await api(page, "POST", `/v1/ai/chats/${chat.id}/messages`, { text: "Hello assistant", file_ids: [] })
    const added = await api<{ items: SourceItem[] }>(page, "POST", `/v1/notebooks/${notebook.id}/sources`, {
      items: [{ kind: "chat", chat_id: chat.id }],
    })
    expect(added.items).toHaveLength(1)
    await sourcesReady(page, notebook.id)

    await openNotebook(page, notebook.id)
    const sources = page.getByRole("region", { name: "Sources" })
    await sources.getByRole("checkbox", { name: "History notes" }).uncheck()
    await sources.getByRole("checkbox", { name: added.items[0]?.title ?? "chat" }).uncheck()

    await ask(page, "Which treaty was signed?")
    await expect(page.getByRole("button", { name: /^Source 1: Biology notes/ }).first()).toBeVisible({
      timeout: 60_000,
    })
    await expect(page.getByRole("button", { name: /History notes/ })).toHaveCount(0)

    // The turn records the sources it used: only the selected one.
    const history200 = await api<{ messages: { role: string; source_ids: string[] }[] }>(
      page,
      "GET",
      `/v1/notebooks/${notebook.id}/chat`,
    )
    const answer = history200.messages.filter((message) => message.role === "assistant").at(-1)
    expect(answer?.source_ids).toEqual([biology.id])
    expect(answer?.source_ids).not.toContain(history.id)
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

test("NB-8 generate a conspect and add it as a source", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E conspect"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id)

    await generateAndOpen(page, "Conspect")
    await expect(page.getByRole("button", { name: "Add as source" })).toBeVisible()
    await a11y(page, testInfo, { label: "sp report viewer" })
    await page.getByRole("button", { name: "Add as source" }).click()

    await page.getByRole("button", { name: "Back to chat" }).first().click()
    const sources = page.getByRole("region", { name: "Sources" })
    await expect(sources.getByRole("checkbox")).toHaveCount(2)
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

test("NB-10 NB-11 answer a quiz, save flash cards as a set and study it", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E study"))
  let setId: string | null = null
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id)

    // Quiz: answer the first question and reach the results.
    await generateAndOpen(page, "Quiz")
    await expect(page.getByText(/Question 1 of/)).toBeVisible()
    await a11y(page, testInfo, { label: "sp quiz viewer" })
    const total = Number(/of (\d+)/.exec((await page.getByText(/Question 1 of/).textContent()) ?? "")?.[1] ?? "1")
    for (let index = 0; index < total; index += 1) {
      await page.getByRole("radiogroup").first().getByRole("radio").first().click()
      await page.getByRole("button", { name: /^(Next|See results)$/ }).click()
    }
    await expect(page.getByText("Accuracy")).toBeVisible()
    await page.getByRole("button", { name: "Back to chat" }).first().click()

    // Flash cards: save as a real set, then study it in the flash cards page.
    await generateAndOpen(page, "Flash cards")
    await page.getByRole("button", { name: "Save as flash card set" }).click()
    const open = page.getByRole("link", { name: "Open set" })
    await expect(open).toBeVisible()
    const href = (await open.getAttribute("href")) ?? ""
    setId = new URL(href, URLS.sp).searchParams.get("id")
    expect(setId).toBeTruthy()
    await open.click()
    await expect(page).toHaveURL(/\/flashcards\/set\/\?id=/)
    const sets = await api<FlashcardSetItem[]>(page, "GET", "/v1/me/flashcard-sets")
    expect(sets.some((set) => set.id === setId)).toBe(true)
  } finally {
    if (setId) await api(page, "DELETE", `/v1/me/flashcard-sets/${setId}`).catch(() => undefined)
    await removeNotebook(page, notebook.id)
  }
})

test("NB-12 mind map: expand a branch, click a node and ask in chat", async ({ page }, testInfo) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E map"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id)

    await generateAndOpen(page, "Mind map")
    const tree = page.getByRole("tree").first()
    await expect(tree).toBeVisible()
    await a11y(page, testInfo, { label: "sp mind map viewer", exclude: ["svg"] })

    // The root and the first level are open; a click on a node shows its note and the actions.
    const nodes = tree.getByRole("treeitem")
    await expect(nodes.nth(1)).toBeVisible()
    await nodes.nth(1).click()
    await page.getByRole("button", { name: "Ask in chat" }).click()

    // The question lands in the chat of the notebook.
    await expect(page.getByRole("textbox", { name: "Message" })).toBeVisible()
    await expect(page.getByText(/using my sources\./).first()).toBeVisible({ timeout: 60_000 })
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

test("NB-19 a phone shows tabs, a citation sheet and the quiz at 360 px", async ({ page }, testInfo) => {
  test.slow()
  await page.setViewportSize({ width: 360, height: 780 })
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E phone"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)
    await openNotebook(page, notebook.id, "&tab=chat")

    // Tabs replace the global bottom bar.
    const tabs = page.getByRole("tablist", { name: "Notebook sections" })
    await expect(tabs.getByRole("tab", { name: "Sources" })).toBeVisible()
    await expect(tabs.getByRole("tab", { name: "Chat" })).toHaveAttribute("aria-selected", "true")
    await expect(tabs.getByRole("tab", { name: "Studio" })).toBeVisible()
    await a11y(page, testInfo, { label: "sp notebook phone chat" })

    // A citation tap opens a bottom sheet with the quote and "Open in source".
    await ask(page, "What is the Calvin cycle?")
    await page
      .getByRole("button", { name: /^Source 1: Biology notes/ })
      .first()
      .click({ timeout: 60_000 })
    const sheet = page.getByRole("dialog")
    await expect(sheet.getByRole("button", { name: "Open in source" })).toBeVisible()
    await sheet.getByRole("button", { name: "Open in source" }).click()
    await expect(page.locator('[data-highlighted="true"]').first()).toBeVisible()
    await page.getByRole("button", { name: "Back to chat" }).first().click()

    // The quiz fits a 360 px screen and is answered with taps.
    await tabs.getByRole("tab", { name: "Studio" }).click()
    await generateAndOpen(page, "Quiz")
    await expect(page.getByText(/Question 1 of/)).toBeVisible()
    const radio = page.getByRole("radiogroup").first().getByRole("radio").first()
    const box = await radio.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

test("NB-14 at the daily quota the Studio tiles are disabled", async ({ page }) => {
  test.slow()
  await loginAs(page, STUDENT, "sp")
  await page.goto(`${URLS.sp}/notebooks/`)
  const notebook = await createNotebook(page, unique("E2E quota"))
  try {
    await addText(page, notebook.id, "Biology notes", PHOTOSYNTHESIS)
    await sourcesReady(page, notebook.id)

    // Make items through the API until the backend refuses (20 a day); a busy answer means 3 are still running.
    let refused = false
    for (let attempt = 0; attempt < 60 && !refused; attempt += 1) {
      try {
        await api<ArtifactItem>(page, "POST", `/v1/notebooks/${notebook.id}/artifacts`, {
          kind: "data_table",
          options: { max_rows: 10 },
        })
      } catch (error) {
        if (!(error instanceof ApiCallError)) throw error
        if (error.status === 429) refused = true
        else if (error.status === 409) await page.waitForTimeout(1500)
        else throw error
      }
    }
    expect(refused, "the daily quota answered 429").toBe(true)

    await openNotebook(page, notebook.id)
    await expect(tile(page, "Mind map")).toBeDisabled()
    await expect(tile(page, "Quiz")).toBeDisabled()
    // Reading what exists keeps working.
    await expect(studioItems(page).first()).toBeVisible()
  } finally {
    await removeNotebook(page, notebook.id)
  }
})

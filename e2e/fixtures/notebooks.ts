/** Notebook helpers shared by the notebook specs: create through the API, wait for the sources, open the workspace. */

import type { NotebookDetail, SourceItem } from "@ihsp/api"
import type { Page } from "@playwright/test"
import { api } from "./api"
import { URLS } from "./env"
import { expect } from "./test"

export const PHOTOSYNTHESIS = [
  "Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose.",
  "The Calvin cycle takes place in the stroma of the chloroplast and builds sugar from carbon dioxide.",
  "The light reactions take place in the thylakoid membranes where water is split and oxygen is released.",
].join("\n\n")

export const HISTORY = [
  "The Khiva Khanate became a Russian protectorate in 1873 after the treaty of Gandemian.",
  "The Bukhara Emirate had signed a similar treaty in 1868 and kept its internal self-government.",
].join("\n\n")

export async function createNotebook(page: Page, title: string): Promise<NotebookDetail> {
  return api<NotebookDetail>(page, "POST", "/v1/notebooks", { title })
}

export async function addText(page: Page, notebookId: string, title: string, text: string): Promise<SourceItem> {
  const result = await api<{ items: SourceItem[] }>(page, "POST", `/v1/notebooks/${notebookId}/sources`, {
    items: [{ kind: "text", title, text }],
  })
  return result.items[0] as SourceItem
}

/** Polls the sources until all are ready (the worker reads them in the background). */
export async function sourcesReady(page: Page, notebookId: string): Promise<SourceItem[]> {
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

export async function removeNotebook(page: Page, notebookId: string): Promise<void> {
  await api(page, "DELETE", `/v1/notebooks/${notebookId}`).catch(() => undefined)
}

export async function openNotebook(page: Page, notebookId: string, query = ""): Promise<void> {
  await page.goto(`${URLS.sp}/notebooks/view/?id=${notebookId}${query}`)
  await expect(page.getByRole("region", { name: "Sources" })).toBeVisible()
}

/** The Studio tile button. */
export function tile(page: Page, name: string) {
  return page.getByRole("list", { name: "Create study materials" }).getByRole("button", { name, exact: true })
}

export function studioItems(page: Page) {
  return page.getByRole("list", { name: "Studio items" }).getByRole("listitem")
}

/** Starts a tile and waits until the newest Studio item is ready (does not open it). */
export async function generateTile(page: Page, tileName: string): Promise<void> {
  await tile(page, tileName).click()
  await expect(studioItems(page).first()).toBeVisible()
  await expect(studioItems(page).first().getByRole("button").first()).toBeVisible({ timeout: 90_000 })
}

import type { Page } from "@ihsp/api"

const MAX_PAGES = 20

/** Follows `next_cursor` until the end (picker lists need every row, not one page). Stops after 20 pages. */
export async function fetchAllPages<T>(fetchPage: (cursor: string | undefined) => Promise<Page<T>>): Promise<T[]> {
  const items: T[] = []
  let cursor: string | undefined
  for (let index = 0; index < MAX_PAGES; index += 1) {
    const page = await fetchPage(cursor)
    items.push(...page.items)
    if (!page.next_cursor) break
    cursor = page.next_cursor
  }
  return items
}

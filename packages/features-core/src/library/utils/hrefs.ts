import { getConfig } from "@ihsp/config"

// Routes of the library app. The app is a static export, so entities are
// addressed by query parameter (`/item/?id=`) and every path ends with a slash.

function withQuery(path: string, params: Record<string, string | number | null | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value))
  }
  const text = query.toString()
  return text ? `${path}?${text}` : path
}

export const homeHref = () => "/"

export type BrowseParams = {
  q?: string
  source?: "all" | "book" | "material" | "external"
  subject?: string
  topic?: string
  tag?: string
  year?: number | string
  type?: string
  lang?: string
  collection?: string
  shelf?: string
}
export const browseHref = (params: BrowseParams = {}) => withQuery("/browse/", params)

/** `idOrSlug` is an item id, or a slug from a public `/b/{slug}` page. */
export const itemHref = (idOrSlug: string) => withQuery("/item/", { id: idOrSlug })
export const readHref = (input: { item: string; file?: string | null; page?: number | null; loc?: string | null }) =>
  withQuery("/read/", { item: input.item, file: input.file, page: input.page, loc: input.loc })

export const listsHref = () => "/lists/"
export const listHref = (id: string) => withQuery("/lists/view/", { id })
export const listEditHref = (id?: string) => withQuery("/lists/edit/", { id })
export const collectionHref = (id: string) => withQuery("/collections/view/", { id })

export const uploadHref = () => "/upload/"
export const uploadEditHref = (id: string) => withQuery("/upload/edit/", { id })
/** The material wizard (notes, worksheets, photos); `/upload/` itself is the book form. */
export const uploadMaterialHref = () => "/upload/material/"
export type MyLibraryTab = "continue" | "shelf" | "notes" | "lists" | "uploads" | "suggestions"
export const myHref = (tab?: MyLibraryTab) => withQuery("/my/", { tab })

export const manageQueueHref = (tab?: string) => withQuery("/manage/queue/", { tab })
export const manageBooksHref = () => "/manage/books/"
export const manageBookEditHref = (id?: string) => withQuery("/manage/books/edit/", { id })
export const manageTopicsHref = () => "/manage/topics/"
export const manageSubjectsHref = () => "/manage/subjects/"
export const manageCollectionsHref = () => "/manage/collections/"
export const manageReportsHref = () => "/manage/reports/"
export const manageStatsHref = () => "/manage/stats/"
export const manageUniLibraryHref = () => "/manage/unilibrary/"

/** A notebook in the student portal (`SP_URL`), where "Add to notebook" ends. */
export const notebookHref = (notebookId: string) =>
  `${getConfig().SP_URL}${withQuery("/notebooks/view/", { id: notebookId })}`

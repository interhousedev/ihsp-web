/** Routes of the notebook pages (static export: the notebook is in the query string). */
export const NOTEBOOKS_HREF = "/notebooks/"

/** The workspace of a notebook. */
export function notebookHref(id: string): string {
  return `/notebooks/view/?id=${encodeURIComponent(id)}`
}

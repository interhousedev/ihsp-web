/** Routes of the notebook pages (static export: the notebook is in the query string). */
export const NOTEBOOKS_HREF = "/notebooks/"

/** The workspace of a notebook; `add` opens the Add sources dialog at once (a notebook that was just created). */
export function notebookHref(id: string, options: { add?: boolean } = {}): string {
  return `/notebooks/view/?id=${encodeURIComponent(id)}${options.add ? "&add=1" : ""}`
}

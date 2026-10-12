/** Routes of the subject pages (static export: the subject is in the query string). */
export const SUBJECTS_HREF = "/subjects/"

/** The page of one subject the teacher teaches. */
export function subjectHref(subjectId: string): string {
  return `/subjects/view/?id=${encodeURIComponent(subjectId)}`
}

import { allowsPublic, type BookForm } from "./book-form"
import { checkPublicDomain } from "./public-domain"

/** A message of `library.manage.editor.error` with its values. */
export type FormIssue = { key: string; values?: Record<string, string | number> }
export type FormIssues = Partial<
  Record<
    "title" | "authors" | "yearPublished" | "publicDomain" | "sourceUrl" | "expiry" | "topics" | "licence",
    FormIssue
  >
>

const YEAR = /^\d{1,4}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

function validUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
}

/** Problems the form can see by itself, before the API is asked (Save and Publish stay off while there are any). */
export function validateForm(form: BookForm, today: Date): FormIssues {
  const issues: FormIssues = {}
  if (!form.title.trim()) issues.title = { key: "titleRequired" }
  if (form.authors.length === 0) issues.authors = { key: "authorsRequired" }
  if (form.yearPublished.trim() && !YEAR.test(form.yearPublished.trim())) issues.yearPublished = { key: "yearInvalid" }

  if (form.rights === "public_domain" && form.basisKind !== "other") {
    const year = form.basisKind === "death" ? form.deathYear : form.firstPublishedYear
    if (year.trim() && !YEAR.test(year.trim())) {
      issues.publicDomain = { key: "yearInvalid" }
    } else {
      const check = checkPublicDomain(
        form.basisKind === "death"
          ? { author_death_year: Number(year) || null }
          : { first_published_year: Number(year) || null },
        today,
      )
      if (check.status === "not_yet") issues.publicDomain = { key: "notYetPublic", values: { year: check.since } }
    }
  }
  if (form.rights === "open_license") {
    if (form.sourceUrl.trim() && !validUrl(form.sourceUrl.trim())) issues.sourceUrl = { key: "urlInvalid" }
  }
  if (form.rights === "permission" && form.permissionExpiresOn.trim() && !DATE.test(form.permissionExpiresOn.trim())) {
    issues.expiry = { key: "dateInvalid" }
  }
  const badRange = form.topics.some((row) => {
    const from = Number(row.page_from)
    const to = Number(row.page_to)
    return row.page_from.trim() !== "" && row.page_to.trim() !== "" && from > to
  })
  if (badRange) issues.topics = { key: "rangeInvalid" }
  return issues
}

const empty = (value: string) => value.trim() === ""

/**
 * The rights fields still empty, named like the API names them in `422 library/rights-incomplete` (`params.missing`),
 * so the same labels serve the local hints and the server's answer.
 */
export function missingRights(form: BookForm): string[] {
  const missing: string[] = []
  if (form.rights === "public_domain") {
    if (form.basisKind === "death" && empty(form.deathYear)) missing.push("rights_basis.author_death_year")
    if (form.basisKind === "anonymous" && empty(form.firstPublishedYear))
      missing.push("rights_basis.first_published_year")
    if (empty(form.rule)) missing.push("rights_basis.rule")
  } else if (form.rights === "open_license") {
    if (empty(form.licence)) missing.push("licence")
    if (empty(form.sourceUrl)) missing.push("rights_basis.source_url")
    if (empty(form.attribution)) missing.push("rights_basis.attribution")
  } else if (form.rights === "permission") {
    if (!form.proofFileId) missing.push("rights_proof_file_id")
    if (empty(form.permissionScope)) missing.push("rights_basis.permission_scope")
    if (empty(form.permissionExpiresOn)) missing.push("rights_basis.permission_expires_on")
  } else if (empty(form.reference)) {
    missing.push("rights_basis.reference")
  }
  return missing
}

export type ChecklistItem = { key: string; ok: boolean }

/** The publish checklist of § 3.4 computed from the form, for a new or edited book the API has not seen yet. */
export function localChecklist(
  form: BookForm,
  file: { present: boolean; textOk: boolean },
  today: Date,
): ChecklistItem[] {
  const rightsOk = missingRights(form).length === 0 && !validateForm(form, today).publicDomain
  return [
    { key: "rights", ok: rightsOk },
    { key: "text_status", ok: file.present && file.textOk },
    { key: "cover", ok: form.coverFileId !== null },
    { key: "subjects", ok: form.subjects.length > 0 },
  ]
}

/** Visibility the form may hold for its rights class. */
export function visibilityFor(form: BookForm): "public" | "lyceum" {
  return allowsPublic(form.rights) ? form.visibility : "lyceum"
}

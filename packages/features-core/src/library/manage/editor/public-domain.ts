// The public-domain rule of the rights panel (docs/reference/study-library.md § 3.4): the author died more than 70 years
// ago, counted from 1 January after the death; an anonymous work first published more than 50 years ago. Pure code, no
// dates read inside: the caller passes "today", so the tests are exact.

/** Years after the death of the author: free from 1 January of (death year + 71). */
export const DEATH_RULE_OFFSET = 71
/** Years after the first publication of an anonymous work: free from 1 January of (publication year + 51). */
export const ANONYMOUS_RULE_OFFSET = 51

export type PublicDomainBasis = {
  author_death_year?: number | null
  first_published_year?: number | null
}

export type PublicDomainCheck =
  /** Neither year is given (a rule text may still justify an official document or folklore). */
  | { status: "missing" }
  /** The work is public domain since 1 January of `since`. */
  | { status: "reached"; since: number; rule: "death" | "anonymous" }
  /** The work becomes public domain on 1 January of `since`: earlier dates are refused. */
  | { status: "not_yet"; since: number; rule: "death" | "anonymous" }

const isYear = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value < 10_000

/** The year from which the work is free: death year + 71, or publication year + 51 for an anonymous work. */
export function publicDomainSince(basis: PublicDomainBasis): { year: number; rule: "death" | "anonymous" } | null {
  if (isYear(basis.author_death_year)) return { year: basis.author_death_year + DEATH_RULE_OFFSET, rule: "death" }
  if (isYear(basis.first_published_year)) {
    return { year: basis.first_published_year + ANONYMOUS_RULE_OFFSET, rule: "anonymous" }
  }
  return null
}

/**
 * Is the work free today? The author's death year wins when both years are given. "Since YYYY" is the 1 January of
 * that year, so a work whose year is the current one is already free.
 */
export function checkPublicDomain(basis: PublicDomainBasis, today: Date): PublicDomainCheck {
  const since = publicDomainSince(basis)
  if (!since) return { status: "missing" }
  const reached = today.getTime() >= new Date(since.year, 0, 1).getTime()
  return { status: reached ? "reached" : "not_yet", since: since.year, rule: since.rule }
}

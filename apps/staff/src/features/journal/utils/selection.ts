import type { JournalOption } from "@ihsp/api"

const SEPARATOR = "|"

/** `<select>` value of a journal option: the subject and the audience key (`2tn2:1`) joined by `|`. */
export function optionValue(option: Pick<JournalOption, "subject" | "audience_key">): string {
  return `${option.subject.id}${SEPARATOR}${option.audience_key}`
}

export function parseOptionValue(value: string): { subject: string; audience: string } | null {
  const index = value.indexOf(SEPARATOR)
  if (index <= 0 || index === value.length - 1) return null
  return { subject: value.slice(0, index), audience: value.slice(index + 1) }
}

/** The option named by `?subject=&audience=`; without a valid pair the first option. */
export function selectedOption(
  options: readonly JournalOption[],
  subject: string | null,
  audience: string | null,
): JournalOption | null {
  const match = options.find((option) => option.subject.id === subject && option.audience_key === audience)
  return match ?? options[0] ?? null
}

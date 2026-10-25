import type { PersonRef } from "@ihsp/api"

/** `Kalandarova G.`: last name and the first letter of the first name. */
export function shortName(person: Pick<PersonRef, "first_name" | "last_name">): string {
  const initial = person.first_name.trim().charAt(0)
  return initial ? `${person.last_name} ${initial.toUpperCase()}.` : person.last_name
}

/** `Brastilov Aleksey`: last name first, as in the journals. */
export function fullName(person: Pick<PersonRef, "first_name" | "last_name">): string {
  return `${person.last_name} ${person.first_name}`.trim()
}

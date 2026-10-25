import type { PersonRef } from "@ihsp/api"

/** `Brastilov Aleksey`: last name first, as in the journals. */
export function fullName(person: Pick<PersonRef, "first_name" | "last_name">): string {
  return `${person.last_name} ${person.first_name}`.trim()
}

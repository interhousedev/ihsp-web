import type { PersonRef } from "@ihsp/api"

/** "Last First", the order used across IHSP lists. */
export function personName(person: Pick<PersonRef, "first_name" | "last_name">): string {
  return `${person.last_name} ${person.first_name}`.trim()
}

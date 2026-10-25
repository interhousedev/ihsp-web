type NameParts = { first_name: string; last_name: string }

/** "Last First" as Uzbek and Russian lists show people. */
export function fullName(person: NameParts | null | undefined): string {
  return person ? `${person.last_name} ${person.first_name}`.trim() : ""
}

/** Display name with the middle name, when there is one. */
export function fullNameWithMiddle(person: NameParts & { middle_name?: string | null }): string {
  return [person.last_name, person.first_name, person.middle_name].filter(Boolean).join(" ")
}

/** Audience as one line: `2TN2`, `2TN2 · 1`, `2TN2 · 2`. */
export function audienceLabel(audience: readonly { group_name: string; subgroup: 1 | 2 | null }[]): string {
  return audience.map((item) => (item.subgroup ? `${item.group_name} · ${item.subgroup}` : item.group_name)).join(", ")
}

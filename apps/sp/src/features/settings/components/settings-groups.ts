import type { Icons } from "@ihsp/ui"

/** The topics of Settings: the index lists them, `/settings/?section=<id>` opens one. */
export const SETTINGS_GROUPS = [
  { id: "profile", icon: "profile" },
  { id: "appearance", icon: "palette" },
  { id: "notifications", icon: "notification" },
  { id: "schedule", icon: "calendar" },
  { id: "security", icon: "lock" },
  { id: "help", icon: "help" },
] as const satisfies readonly { id: string; icon: keyof typeof Icons }[]

export type SettingsGroupId = (typeof SETTINGS_GROUPS)[number]["id"]

export function parseSettingsGroup(value: string | null): SettingsGroupId | null {
  return SETTINGS_GROUPS.find((group) => group.id === value)?.id ?? null
}

export function settingsGroupHref(id: SettingsGroupId): string {
  return `/settings/?section=${id}`
}

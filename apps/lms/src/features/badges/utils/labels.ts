import type { BadgeLabels } from "@ihsp/api"

/** The text in the UI language, falling back to the first filled one. */
export function localized(labels: BadgeLabels, locale: string): string {
  return labels[locale as keyof BadgeLabels] || labels.en || labels.ru || labels.uz
}

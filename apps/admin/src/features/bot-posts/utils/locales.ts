import type { BotPost, BotPostLocalized } from "@ihsp/api"

/** The three content locales of a bot post, in tab order. */
export const LOCALE_CODES = ["uz", "ru", "en"] as const

export type BotLocale = (typeof LOCALE_CODES)[number]

/** Text of one locale; null or missing is an empty string. */
export function localized(value: BotPostLocalized | undefined, locale: BotLocale): string {
  return value?.[locale] ?? ""
}

/** Title in the viewer's locale, falling back to the other locales, then to the slug. */
export function postLabel(post: BotPost, locale: string): string {
  const preferred = (LOCALE_CODES as readonly string[]).includes(locale) ? (locale as BotLocale) : "ru"
  return (
    localized(post.title, preferred) ||
    localized(post.title, "ru") ||
    localized(post.title, "uz") ||
    localized(post.title, "en") ||
    post.slug
  )
}

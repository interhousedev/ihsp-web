import type { Locale } from "./locales"

export type Messages = { [key: string]: string | Messages }

type MessageModule = Messages | { default: Messages }

/** Loads the messages of one app for a locale; the apps pass `(locale) => import(`../../messages/${locale}.json`)`. */
export type MessageLoader = (locale: Locale) => Promise<MessageModule>

function unwrap(module: MessageModule): Messages {
  return "default" in module && typeof module.default === "object" ? (module.default as Messages) : (module as Messages)
}

function isMessages(value: string | Messages | undefined): value is Messages {
  return typeof value === "object" && value !== null
}

/** Deep merge; keys of `override` win. */
export function mergeMessages(base: Messages, override: Messages): Messages {
  const result: Messages = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const existing = result[key]
    result[key] = isMessages(existing) && isMessages(value) ? mergeMessages(existing, value) : value
  }
  return result
}

export async function loadSharedMessages(locale: Locale): Promise<Messages> {
  return unwrap(await import(`../messages/${locale}.json`))
}

/** Shared messages of `@ihsp/i18n` merged with the app's own messages. */
export async function loadMessages(locale: Locale, appLoader?: MessageLoader): Promise<Messages> {
  const [shared, app] = await Promise.all([loadSharedMessages(locale), appLoader ? appLoader(locale) : undefined])
  return app ? mergeMessages(shared, unwrap(app)) : shared
}

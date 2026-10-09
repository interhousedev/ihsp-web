import type { Locale, Messages } from "@ihsp/i18n"

/**
 * The `library` message namespace for a locale (`library.*`): the area files of `messages/<locale>/` merged by
 * `<locale>/index.ts`. An app puts it into its own loader (`mergeMessages(app, await loadLibraryMessages(locale))`).
 * The path of the import is a literal template, so the bundler includes exactly the three locale folders.
 */
export async function loadLibraryMessages(locale: Locale): Promise<Messages> {
  const loaded = (await import(`./${locale}/index`)) as { default: Messages }
  return loaded.default
}

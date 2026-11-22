import { useT } from "@ihsp/i18n"

const KNOWN = new Set([
  "kitchen", "mistake", "object", "street", "argument", "teacher", "hands", "silence", "first", "map", "question",
  "rule", "sound", "change", "stranger", "build", "language", "weather", "photo", "letter", "work",
  "my_day", "essay_idea", "five_senses", "overheard", "tomorrow", "thanks",
]) // prettier-ignore

/** The localized label of a practice theme key (daily or creative); an unknown key is humanized. */
export function useThemeLabel() {
  const t = useT("essayPractice")
  return (key: string) => {
    if (KNOWN.has(key)) return t(`themes.${key}`)
    const words = key.replace(/[_-]+/g, " ").trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
  }
}

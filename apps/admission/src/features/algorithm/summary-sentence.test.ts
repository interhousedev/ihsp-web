import { describe, expect, test } from "bun:test"
import { createTranslator } from "next-intl"
import en from "../../../messages/en.json"
import ru from "../../../messages/ru.json"
import uz from "../../../messages/uz.json"
import { sentenceValues } from "./questions"

const BUNDLES = { en, ru, uz } as const

function sentence(locale: keyof typeof BUNDLES, parts: Parameters<typeof sentenceValues>[0]) {
  const t = createTranslator({ locale, messages: BUNDLES[locale], namespace: "prefs" })
  return t("summary.sentence", sentenceValues(parts))
}

describe("algorithm summary sentence", () => {
  test("a full answer reads as one sentence in every language", () => {
    const parts = { major: "Computer Science", budget: "under $10,000", region: "United Kingdom" }
    expect(sentence("en", parts)).toBe("Colleges in United Kingdom offering Computer Science, under $10,000.")
    for (const locale of ["ru", "uz"] as const) {
      const text = sentence(locale, parts)
      expect(text).toContain("United Kingdom")
      expect(text).toContain("Computer Science")
      expect(text).toContain("$10,000")
      expect(text).not.toContain("none")
    }
  })

  test("open parts are left out", () => {
    expect(sentence("en", { major: "Physics" })).toBe("Colleges offering Physics.")
    expect(sentence("en", {})).toBe("Colleges.")
  })
})

import { describe, expect, test } from "bun:test"
import en from "../../messages/en.json"
import ru from "../../messages/ru.json"
import uz from "../../messages/uz.json"
import { currencyOf, formatCurrency, moneyText } from "../features/chooser/components/money"

const NAV_KEYS = [
  "home",
  "activities",
  "universities",
  "documents",
  "caseload",
  "inbox",
  "staffDocuments",
  "transcripts",
  "settings",
] as const

describe("ADM-UX-A2-S1 money", () => {
  test("ADM-UX-A2-S1: the currency comes from the backend label, not a hard-coded dollar", () => {
    expect(currencyOf("EUR 17 700")).toBe("EUR")
    expect(currencyOf("$17 700")).toBe("USD")
    expect(formatCurrency(17700, "EUR", "en")).toBe("€17,700")
    expect(formatCurrency(17700, "EUR", "en")).not.toContain("$")
  })

  test("ADM-UX-A2-S1: without a currency the plain number is shown", () => {
    expect(formatCurrency(17700, null, "en")).toBe("17,700")
    expect(moneyText({ kind: "money", value: 5, value_text: "5" }, "en")).toBe("5")
    expect(moneyText({ kind: "text", value: "x", value_text: "EUR x" }, "en")).toBe("EUR x")
  })
})

describe("ADM-UX-A2-N5 nav labels", () => {
  for (const [name, messages] of Object.entries({ en, ru, uz })) {
    test(`ADM-UX-A2-N5: ${name} short labels only drop words from the title and fit`, () => {
      const nav = messages.nav as Record<string, unknown> & { short: Record<string, string> }
      for (const key of NAV_KEYS) {
        const short = nav.short[key] as string
        const title = (nav[key] as string).toLowerCase().split(/\s+/)
        expect(short.length).toBeLessThanOrEqual(12)
        for (const word of short.toLowerCase().split(/\s+/)) expect(title).toContain(word)
      }
    })
  }
})

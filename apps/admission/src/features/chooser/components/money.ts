const SYMBOLS: Record<string, string> = { $: "USD", "€": "EUR", "£": "GBP" }

/** ISO currency code at the start of a backend label such as "EUR 17 700" or "$17 700"; null when there is none. */
export function currencyOf(text: string): string | null {
  const iso = /^[A-Z]{3}(?=\s|\d)/.exec(text.trim())
  if (iso) return iso[0]
  return SYMBOLS[text.trim().charAt(0)] ?? null
}

/** A whole-number amount in the reader's locale; the plain number when the currency is unknown. */
export function formatCurrency(value: unknown, currency: string | null, locale: string): string | null {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN
  if (!Number.isFinite(number)) return null
  const digits = Number.isInteger(number) ? 0 : 2
  try {
    return currency
      ? new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: digits }).format(number)
      : new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(number)
  } catch {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(number)
  }
}

/** Display text for a money row: Intl-formatted when value and currency are known, the backend text otherwise. */
export function moneyText(row: { kind: string; value: unknown; value_text: string }, locale: string): string {
  if (row.kind !== "money") return row.value_text
  return formatCurrency(row.value, currencyOf(row.value_text), locale) ?? row.value_text
}

/** Like {@link formatCurrency} but short for tight cells ("$12.4K"); `signed` adds an explicit + or − sign. */
export function formatCompactCurrency(value: number, currency: string, locale: string, signed = false): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
      signDisplay: signed ? "exceptZero" : "auto",
    }).format(value)
  } catch {
    return `${signed && value > 0 ? "+" : ""}${new Intl.NumberFormat(locale, { notation: "compact" }).format(value)}`
  }
}

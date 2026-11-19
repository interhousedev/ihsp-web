"use client"

import { useLocale, useT } from "@ihsp/i18n"

type Loose = { (key: string): string; has: (key: string) => boolean }

/** Country names for the engines whose `Intl.DisplayNames` lacks uz or ru: [code, ru, uz]. English is the catalog value. */
const COUNTRIES: Record<string, { code: string; ru: string; uz: string }> = {
  "united states": { code: "US", ru: "США", uz: "Qoʻshma Shtatlar" },
  "united arab emirates": { code: "AE", ru: "ОАЭ", uz: "Birlashgan Arab Amirliklari" },
  germany: { code: "DE", ru: "Германия", uz: "Germaniya" },
  "united kingdom": { code: "GB", ru: "Великобритания", uz: "Buyuk Britaniya" },
  hungary: { code: "HU", ru: "Венгрия", uz: "Vengriya" },
  italy: { code: "IT", ru: "Италия", uz: "Italiya" },
  japan: { code: "JP", ru: "Япония", uz: "Yaponiya" },
  "south korea": { code: "KR", ru: "Южная Корея", uz: "Janubiy Koreya" },
  canada: { code: "CA", ru: "Канада", uz: "Kanada" },
  france: { code: "FR", ru: "Франция", uz: "Fransiya" },
  turkey: { code: "TR", ru: "Турция", uz: "Turkiya" },
  australia: { code: "AU", ru: "Австралия", uz: "Avstraliya" },
  singapore: { code: "SG", ru: "Сингапур", uz: "Singapur" },
  china: { code: "CN", ru: "Китай", uz: "Xitoy" },
  malaysia: { code: "MY", ru: "Малайзия", uz: "Malayziya" },
  uzbekistan: { code: "UZ", ru: "Узбекистан", uz: "Oʻzbekiston" },
  kazakhstan: { code: "KZ", ru: "Казахстан", uz: "Qozogʻiston" },
  russia: { code: "RU", ru: "Россия", uz: "Rossiya" },
  spain: { code: "ES", ru: "Испания", uz: "Ispaniya" },
  netherlands: { code: "NL", ru: "Нидерланды", uz: "Niderlandiya" },
  switzerland: { code: "CH", ru: "Швейцария", uz: "Shveytsariya" },
  poland: { code: "PL", ru: "Польша", uz: "Polsha" },
  czechia: { code: "CZ", ru: "Чехия", uz: "Chexiya" },
  "czech republic": { code: "CZ", ru: "Чехия", uz: "Chexiya" },
  india: { code: "IN", ru: "Индия", uz: "Hindiston" },
  "saudi arabia": { code: "SA", ru: "Саудовская Аравия", uz: "Saudiya Arabistoni" },
  qatar: { code: "QA", ru: "Катар", uz: "Qatar" },
  ireland: { code: "IE", ru: "Ирландия", uz: "Irlandiya" },
  sweden: { code: "SE", ru: "Швеция", uz: "Shvetsiya" },
  finland: { code: "FI", ru: "Финляндия", uz: "Finlyandiya" },
  austria: { code: "AT", ru: "Австрия", uz: "Avstriya" },
  "new zealand": { code: "NZ", ru: "Новая Зеландия", uz: "Yangi Zelandiya" },
}

const BY_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRIES).map(([name, { code }]) => [code, name]),
)

/** The country in `locale`: `Intl.DisplayNames` first; when it answers the code or the English name for a non-English locale, the table. */
export function countryName(value: string, locale: string): string {
  const key = /^[a-z]{2}$/i.test(value) ? BY_CODE[value.toUpperCase()] : value.trim().toLowerCase()
  const english = key ? COUNTRIES[key] : undefined
  const code = /^[a-z]{2}$/i.test(value) ? value.toUpperCase() : english?.code
  let shown: string | undefined
  if (code) {
    try {
      shown = new Intl.DisplayNames([locale], { type: "region" }).of(code)
    } catch {
      shown = undefined
    }
  }
  if (locale === "en") return shown && shown !== code ? shown : value
  const englishName = code ? new Intl.DisplayNames(["en"], { type: "region" }).of(code) : undefined
  if (shown && shown !== code && shown !== englishName && shown !== value) return shown
  if (english && (locale === "uz" || locale === "ru")) return english[locale]
  return shown && shown !== code ? shown : value
}

/** Label of a backend option value (`chooser.options.<group>.<value>`); an unknown value shows as the backend sent it. */
export function useOptionLabel(group: string): (value: string) => string {
  const t = useT("chooser") as unknown as Loose
  const locale = useLocale()
  return (value) => {
    if (group === "country") return countryName(value, locale)
    const exact = `options.${group}.${value}`
    const key = `options.${group}.${value.toLowerCase()}`
    return t.has(exact) ? t(exact) : t.has(key) ? t(key) : value
  }
}

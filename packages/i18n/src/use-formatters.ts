"use client"

import { useLocale } from "next-intl"
import { useMemo } from "react"
import { formatDate, formatDateTime, formatRelative, formatTime, formatWeekday, type DateInput } from "./format"
import { isLocale, type Locale } from "./locales"

/** Formatters bound to the locale of the provider (re-render when the language changes). */
export function useFormatters() {
  const raw = useLocale()
  const locale: Locale = isLocale(raw) ? raw : "ru"
  return useMemo(
    () => ({
      locale,
      date: (value: DateInput, options?: Intl.DateTimeFormatOptions) => formatDate(value, locale, options),
      time: (value: DateInput) => formatTime(value, locale),
      dateTime: (value: DateInput) => formatDateTime(value, locale),
      weekday: (value: DateInput, style?: "short" | "long" | "narrow") => formatWeekday(value, locale, style),
      relative: (value: DateInput, now?: DateInput) => formatRelative(value, locale, now),
    }),
    [locale],
  )
}

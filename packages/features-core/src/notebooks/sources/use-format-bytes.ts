"use client"

import { useFormatters } from "@ihsp/i18n"

/** File size in the user's language (`482 kB`, `3,2 MB`). */
export function useFormatBytes(): (bytes: number) => string {
  const { locale } = useFormatters()
  return (bytes) => {
    const megabytes = bytes / (1024 * 1024)
    const unit = megabytes >= 1 ? "megabyte" : "kilobyte"
    const value = megabytes >= 1 ? megabytes : Math.max(1, bytes / 1024)
    return new Intl.NumberFormat(locale, { style: "unit", unit, maximumFractionDigits: 1 }).format(value)
  }
}

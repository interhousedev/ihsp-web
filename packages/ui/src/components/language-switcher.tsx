"use client"

import { LOCALES, LOCALE_NAMES, isLocale, setLocale, useLocale, useT, type Locale } from "@ihsp/i18n"
import { Icons } from "./icons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { cn } from "../lib/utils"

/**
 * Language picker (uz, ru, en). It applies the language at once and remembers it in `localStorage`; pass `onChange`
 * to also save it in the account (`patchPreferences({ locale })`).
 */
export function LanguageSwitcher({ onChange, className }: { onChange?: (locale: Locale) => void; className?: string }) {
  const t = useT()
  const current = useLocale()
  const items = LOCALES.map((locale) => ({ value: locale, label: LOCALE_NAMES[locale] }))

  return (
    <Select
      items={items}
      value={current}
      onValueChange={(value) => {
        if (!isLocale(value)) return
        setLocale(value)
        onChange?.(value)
      }}
    >
      <SelectTrigger
        aria-label={t("locale.switcher")}
        className={cn("rounded-full border-transparent bg-muted hover:bg-muted/70", className)}
      >
        <Icons.globe className="text-muted-foreground size-4" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

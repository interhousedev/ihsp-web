"use client"

import { LOCALES, LOCALE_NAMES, isLocale, setLocale, useLocale, useT, type Locale } from "@ihsp/i18n"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Icons } from "../icons"
import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { NavIconView } from "./nav-icon"
import type { NavIcon } from "./nav-types"
import { UserAvatar } from "./user-avatar"

export type UserMenuItem = {
  key: string
  title: string
  icon?: NavIcon
  /** Internal path (rendered as a link) ... */
  href?: string
  /** ... or an action. */
  onSelect?: () => void
}

const THEMES = ["light", "dark", "system"] as const

/**
 * Profile menu for the top bar or the sidebar footer: who is logged in, app links, language, light/dark mode and
 * log out. It knows nothing about auth: the app passes the user and `onLogout` (`logout()` from `@ihsp/auth`).
 */
export function UserMenu({
  name,
  subtitle,
  imageUrl,
  items = [],
  onLogout,
  onLocaleChange,
}: {
  name: string
  subtitle?: string | null
  imageUrl?: string | null
  items?: UserMenuItem[]
  onLogout: () => void
  /** Called after the language was changed (save it in the account with `patchPreferences`). */
  onLocaleChange?: (locale: Locale) => void
}) {
  const t = useT()
  const locale = useLocale()
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="size-11 rounded-full p-0 md:size-9" aria-label={t("user.menu")} />}
      >
        <UserAvatar name={name} imageUrl={imageUrl} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="px-1 py-1.5">
              <UserAvatar name={name} imageUrl={imageUrl} subtitle={subtitle} showInfo />
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        {items.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {items.map((item) => (
                <DropdownMenuItem
                  key={item.key}
                  className="min-h-11 md:min-h-8"
                  render={item.href ? <Link href={item.href} aria-label={item.title} /> : undefined}
                  onClick={item.onSelect}
                >
                  <NavIconView icon={item.icon} />
                  {item.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("common.language")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value) => {
              if (!isLocale(value)) return
              setLocale(value)
              onLocaleChange?.(value)
            }}
          >
            {LOCALES.map((code) => (
              <DropdownMenuRadioItem key={code} value={code} className="min-h-11 md:min-h-8">
                {LOCALE_NAMES[code]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("common.theme")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(value) => setTheme(value)}>
            {THEMES.map((mode) => (
              <DropdownMenuRadioItem key={mode} value={mode} className="min-h-11 md:min-h-8">
                {t(`theme.${mode}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={onLogout}>
            <Icons.logout aria-hidden />
            {t("common.logout")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

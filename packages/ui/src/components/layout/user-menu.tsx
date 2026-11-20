"use client"

import { LOCALES, LOCALE_NAMES, isLocale, setLocale, useLocale, useT, type Locale } from "@ihsp/i18n"
import Link from "next/link"
import type { MouseEvent } from "react"
import { Icons } from "../icons"
import { THEME_CHOICES, isThemeChoice, useThemeChoice } from "../themes/theme-choice"
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
import { PlatformIcon } from "./platform-icon"
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

/** A platform of the IHSP family the user can open from the menu (built by `usePlatformLinks` in `@ihsp/features-core`). */
export type PlatformLink = {
  key: "sp" | "staff" | "admin" | "lms" | "library" | "admission" | "id"
  /** Site name: my.iht, IHT Учителям, admin.iht, lms.iht, library.iht, IHT ID. */
  name: string
  /** What the platform is for, already translated. */
  description: string
  /** Absolute address; opens in the same tab. */
  href: string
  /** The app the user is in now. */
  current: boolean
  /** Replaces the plain navigation where the page cannot follow the link itself (the Telegram mini app). */
  onClick?: (event: MouseEvent) => void
  /** The app's own icon (its `icons/icon-192.png`), absolute address. */
  iconSrc?: string
}

/**
 * Profile menu for the top bar or the sidebar footer: who is logged in, app links, language, light/dark mode and
 * log out. It knows nothing about auth: the app passes the user and `onLogout` (`logout()` from `@ihsp/auth`).
 */
export function UserMenu({
  name,
  subtitle,
  imageUrl,
  items = [],
  platforms = [],
  onLogout,
  onLocaleChange,
  variant = "avatar",
}: {
  name: string
  subtitle?: string | null
  imageUrl?: string | null
  items?: UserMenuItem[]
  /** Other IHSP platforms for this user (`usePlatformLinks()`); the current one is marked. */
  platforms?: PlatformLink[]
  onLogout: () => void
  /** Called after the language was changed (save it in the account with `patchPreferences`). */
  onLocaleChange?: (locale: Locale) => void
  /** `avatar`: a round button for the top bar. `row`: name and login in a full-width row, the menu opens upwards. */
  variant?: "avatar" | "row"
}) {
  const t = useT()
  const locale = useLocale()
  const { theme, setTheme } = useThemeChoice()
  const row = variant === "row"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          row ? (
            <Button
              variant="ghost"
              className="h-auto min-h-11 w-full justify-start rounded-full px-2 py-1.5 md:min-h-10 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0"
              aria-label={t("user.menu")}
            />
          ) : (
            <Button
              variant="ghost"
              className="size-11 rounded-full p-0 ring-1 ring-hairline md:size-9"
              aria-label={t("user.menu")}
            />
          )
        }
      >
        {row ? (
          <UserAvatar name={name} imageUrl={imageUrl} subtitle={subtitle} showInfo />
        ) : (
          <UserAvatar name={name} imageUrl={imageUrl} />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-h-[calc(100dvh-4rem)] w-64 overflow-y-auto"
        align={row ? "start" : "end"}
        side={row ? "top" : "bottom"}
        sideOffset={10}
      >
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
        {platforms.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("platforms.title")}</DropdownMenuLabel>
              <div className="grid grid-cols-2 gap-1" data-testid="app-switcher">
                {platforms.map((platform) => (
                  <DropdownMenuItem
                    key={platform.key}
                    className="min-h-11 min-w-0 flex-col items-start gap-1.5 px-2 py-2 md:min-h-9"
                    render={
                      <a
                        href={platform.href}
                        aria-current={platform.current ? "page" : undefined}
                        data-platform={platform.key}
                        onClick={platform.onClick}
                      />
                    }
                  >
                    <span className="flex w-full items-center gap-2">
                      <PlatformIcon platform={platform} />
                      {platform.current ? (
                        <>
                          <Icons.check aria-hidden className="ms-auto" />
                          <span className="sr-only">{t("platforms.current")}</span>
                        </>
                      ) : null}
                    </span>
                    <span className="flex w-full min-w-0 flex-col">
                      <span className="truncate font-medium">{platform.name}</span>
                      <span className="text-muted-foreground truncate text-xs">{platform.description}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
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
          <DropdownMenuRadioGroup
            className="grid grid-cols-3 gap-1 px-1"
            value={theme}
            onValueChange={(value) => {
              if (isThemeChoice(value)) setTheme(value)
            }}
          >
            {THEME_CHOICES.map((mode) => (
              <DropdownMenuRadioItem key={mode} value={mode} className="data-checked:bg-accent data-checked:font-medium min-h-11 min-w-0 justify-center px-1 pr-1 pl-1 text-xs md:min-h-8 [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden"
              >
                <span className="truncate">{t(`theme.${mode}`)}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="bg-popover sticky bottom-0">
          <DropdownMenuItem className="min-h-11 md:min-h-8" onClick={onLogout}>
            <Icons.logout aria-hidden />
            {t("common.logout")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

"use client"

import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "../../lib/utils"
import { Icons } from "../icons"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet"
import { NavIconView } from "./nav-icon"
import { isActivePath, type BottomNavItem, type NavGroup } from "./nav-types"
import { PLATFORM_ICONS } from "./platform-menu"
import type { PlatformLink } from "./user-menu"

const MAX_ITEMS = 5

/** One slot: a circular icon pill (filled for the active page) above a short label; the slot itself is the 44 px target. */
const itemClass =
  "press relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-medium leading-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"

const iconPillClass =
  "flex size-8 items-center justify-center rounded-full transition-[background-color,color] duration-(--motion-duration-base) ease-(--ease-standard) motion-reduce:transition-none"

export type BottomNavProps = {
  items: BottomNavItem[]
  /** The full navigation for the "More" sheet; without it there is no More slot. */
  more?: NavGroup[]
  /** Drops the pages already in the bar from the More sheet (sp: the bar is the user's own choice). */
  excludeVisibleFromMore?: boolean
  /** `data-testid` of the bar. */
  testId?: string
  /** The account row at the end of the "More" sheet: phones have no sidebar to hold it. */
  moreFooter?: ReactNode
  /** The user's platforms, listed by name in the "More" sheet: the way to another app on a phone. */
  platforms?: PlatformLink[]
}

/**
 * Phone bottom bar: a floating glass pill above the safe area with an icon and label per item; the active one is a
 * filled circle. At most five slots; with `more` (the full navigation) the last slot is "More", which opens a sheet
 * with every section.
 */
export function BottomNav({
  items,
  more,
  excludeVisibleFromMore = false,
  testId,
  moreFooter,
  platforms = [],
}: BottomNavProps) {
  const t = useT()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreNav = useRef<HTMLElement>(null)
  const visible = items.slice(0, more ? MAX_ITEMS - 1 : MAX_ITEMS)
  const visibleUrls = new Set(visible.map((item) => item.url))
  const moreGroups = excludeVisibleFromMore
    ? (more ?? [])
        .map((group) => ({ ...group, items: group.items.filter((item) => !visibleUrls.has(item.url)) }))
        .filter((group) => group.items.length > 0)
    : more
  const otherPlatforms = platforms.filter((platform) => !platform.current)
  // On a page without its own slot "More" is where the user is, so one slot is always lit.
  const moreActive =
    !visible.some((item) => isActivePath(pathname, item.url, item.match)) &&
    (more ?? []).some((group) => group.items.some((item) => isActivePath(pathname, item.url, item.match)))

  // The current page is scrolled into the middle of the sheet, so the place is found at once.
  useEffect(() => {
    if (!moreOpen) return
    const frame = requestAnimationFrame(() => {
      moreNav.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView?.({ block: "center" })
    })
    return () => cancelAnimationFrame(frame)
  }, [moreOpen])

  return (
    <>
      <nav
        aria-label={t("nav.bottom")}
        data-testid={testId}
        className="glass fixed inset-x-3 bottom-[calc(var(--safe-bottom)+0.5rem)] z-30 flex rounded-full p-1 md:hidden"
      >
        {visible.map((item) => {
          const active = isActivePath(pathname, item.url, item.match)
          return (
            <Link
              key={item.url}
              href={item.url}
              aria-current={active ? "page" : undefined}
              data-active={active}
              className={cn(itemClass, active ? "text-foreground" : "text-muted-foreground")}
            >
              <span className={cn(iconPillClass, active && "bg-primary text-primary-foreground")}>
                <NavIconView icon={item.icon} className="size-5" />
              </span>
              <span className="max-w-full truncate">{item.title}</span>
              {item.badge ? (
                <span className="bg-destructive text-destructive-foreground absolute top-1 left-1/2 ml-2 min-w-4 rounded-full px-1 text-center text-[10px] leading-4">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
        {more ? (
          <button
            type="button"
            className={cn(itemClass, moreActive ? "text-foreground" : "text-muted-foreground")}
            data-active={moreActive}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
          >
            <span className={cn(iconPillClass, moreActive && "bg-primary text-primary-foreground")}>
              <Icons.dots className="size-5" aria-hidden />
            </span>
            <span>{t("nav.more")}</span>
          </button>
        ) : null}
      </nav>
      {more ? (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto pb-[var(--safe-bottom)]">
            <SheetHeader>
              <SheetTitle>{t("nav.moreTitle")}</SheetTitle>
            </SheetHeader>
            <nav ref={moreNav} aria-label={t("nav.main")} className="flex flex-col gap-4 px-4 pb-4">
              {(moreGroups ?? []).map((group, index) => (
                <div key={group.label ?? index} className="flex flex-col gap-1">
                  {group.label ? (
                    <p className="text-muted-foreground px-3 text-xs font-medium uppercase">{group.label}</p>
                  ) : null}
                  {group.items.map((item) => {
                    const active = isActivePath(pathname, item.url, item.match)
                    return (
                      <Link
                        key={item.url}
                        href={item.url}
                        onClick={() => setMoreOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "press hover:bg-accent flex min-h-12 items-center gap-3 rounded-full px-3 text-sm",
                          active && "bg-primary text-primary-foreground hover:bg-primary font-medium",
                        )}
                      >
                        <NavIconView icon={item.icon} className="size-5" />
                        {item.title}
                      </Link>
                    )
                  })}
                </div>
              ))}
              {otherPlatforms.length > 0 ? (
                <div data-slot="more-platforms" className="flex flex-col gap-1">
                  <p className="text-muted-foreground px-3 text-xs font-medium uppercase">{t("platforms.title")}</p>
                  {otherPlatforms.map((platform) => (
                    <a
                      key={platform.key}
                      href={platform.href}
                      data-platform={platform.key}
                      onClick={platform.onClick}
                      className="press hover:bg-accent flex min-h-12 items-center gap-3 rounded-full px-3 text-sm"
                    >
                      <NavIconView icon={PLATFORM_ICONS[platform.key]} className="size-5" />
                      <span className="flex min-w-0 flex-col">
                        <span className="font-medium">{platform.name}</span>
                        <span className="text-muted-foreground truncate text-xs">{platform.description}</span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : null}
            </nav>
            {moreFooter ? (
              <div data-slot="more-account" className="border-t border-hairline p-2">
                {moreFooter}
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  )
}

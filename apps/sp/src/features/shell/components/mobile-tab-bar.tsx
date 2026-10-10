"use client"

import { useT } from "@ihsp/i18n"
import { Icons, isActivePath, NavIconView, Sheet, SheetContent, SheetHeader, SheetTitle, cn } from "@ihsp/ui"
import type { NavGroup, NavItem } from "@ihsp/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo, useState } from "react"
import { useBottomBar } from "../hooks/use-bottom-bar"
import { DESTINATION_URLS } from "../utils/bottom-bar"

const itemClass =
  "relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium leading-tight outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"

/**
 * The phone bottom bar of the student app: the pages the user chose in Settings (icon and short label, the current one
 * marked) plus "More", a sheet with every other page. Hidden from 768 px, where the sidebar takes over; sits above the
 * home indicator (safe-area inset).
 */
export function MobileTabBar({ groups }: { groups: NavGroup[] }) {
  const t = useT()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const { ids } = useBottomBar()

  const byUrl = useMemo(() => {
    const map = new Map<string, NavItem>()
    for (const group of groups) for (const item of group.items) map.set(item.url, item)
    return map
  }, [groups])
  const tabs = ids.flatMap((id) => {
    const item = byUrl.get(DESTINATION_URLS[id])
    return item ? [{ ...item, short: t(`nav.short.${id}`) }] : []
  })
  const tabUrls = new Set(tabs.map((item) => item.url))
  const rest = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !tabUrls.has(item.url)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <nav
        aria-label={t("nav.bottom")}
        data-testid="mobile-tab-bar"
        className="bg-background/95 fixed inset-x-0 bottom-0 z-30 flex border-t pb-[var(--safe-bottom)] backdrop-blur md:hidden"
      >
        {tabs.map((item) => {
          const active = isActivePath(pathname, item.url, item.match)
          return (
            <Link
              key={item.url}
              href={item.url}
              aria-current={active ? "page" : undefined}
              data-active={active}
              className={cn(itemClass, active ? "text-primary" : "text-muted-foreground")}
            >
              <NavIconView icon={item.icon} className="size-6" />
              <span className="max-w-full truncate">{item.short}</span>
            </Link>
          )
        })}
        <button
          type="button"
          className={cn(itemClass, "text-muted-foreground")}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen(true)}
        >
          <Icons.dots className="size-6" aria-hidden />
          <span>{t("nav.more")}</span>
        </button>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto pb-[var(--safe-bottom)]">
          <SheetHeader>
            <SheetTitle>{t("nav.moreTitle")}</SheetTitle>
          </SheetHeader>
          <nav aria-label={t("nav.main")} className="flex flex-col gap-4 px-4 pb-4">
            {rest.map((group, index) => (
              <div key={group.label ?? index} className="flex flex-col gap-1">
                {group.label ? (
                  <p className="text-muted-foreground px-2 text-xs font-medium uppercase">{group.label}</p>
                ) : null}
                {group.items.map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActivePath(pathname, item.url, item.match) ? "page" : undefined}
                    className="hover:bg-accent flex min-h-12 items-center gap-3 rounded-lg px-2 text-sm"
                  >
                    <NavIconView icon={item.icon} className="size-5" />
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}

"use client"

import { useT } from "@ihsp/i18n"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "../../lib/utils"
import { Icons } from "../icons"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet"
import { NavIconView } from "./nav-icon"
import { isActivePath, type BottomNavItem, type NavGroup } from "./nav-types"

const MAX_ITEMS = 5

const itemClass =
  "relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium leading-tight outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"

/**
 * Phone bottom bar: icon and label per item, the active one is marked by the current path. At most five slots; with
 * `more` (the full navigation) the last slot is "More", which opens a sheet with every section.
 */
export function BottomNav({ items, more }: { items: BottomNavItem[]; more?: NavGroup[] }) {
  const t = useT()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)
  const visible = items.slice(0, more ? MAX_ITEMS - 1 : MAX_ITEMS)

  return (
    <>
      <nav
        aria-label={t("nav.bottom")}
        className="bg-background/95 fixed inset-x-0 bottom-0 z-30 flex border-t pb-[var(--safe-bottom)] backdrop-blur md:hidden"
      >
        {visible.map((item) => {
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
              <span className="max-w-full truncate">{item.title}</span>
              {item.badge ? (
                <span className="bg-primary text-primary-foreground absolute top-1.5 left-1/2 ml-2 min-w-4 rounded-full px-1 text-center text-[10px] leading-4">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
        {more ? (
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
        ) : null}
      </nav>
      {more ? (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto pb-[var(--safe-bottom)]">
            <SheetHeader>
              <SheetTitle>{t("nav.moreTitle")}</SheetTitle>
            </SheetHeader>
            <nav aria-label={t("nav.main")} className="flex flex-col gap-4 px-4 pb-4">
              {more.map((group, index) => (
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
                      className={cn(
                        "hover:bg-accent flex min-h-12 items-center gap-3 rounded-lg px-2 text-sm",
                        isActivePath(pathname, item.url, item.match) && "bg-accent font-medium",
                      )}
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
      ) : null}
    </>
  )
}

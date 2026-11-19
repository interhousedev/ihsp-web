"use client"

import { useT } from "@ihsp/i18n"
import { cn, NavIconView, type BottomNavItem } from "@ihsp/ui"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { sectionFor } from "../../../config/nav"

/**
 * The phone bar of the five sections. The stock `BottomNav` lights a slot by its own URL; a section owns several routes
 * (`/plan/` belongs to Activities), so the active slot is the section of the current path. The bar replaces "More":
 * the secondary links live in the header menu.
 */
export function SectionBottomBar({ items }: { items: BottomNavItem[] }) {
  const t = useT()
  const active = sectionFor(usePathname())
  return (
    <nav
      aria-label={t("nav.bottom")}
      data-testid="section-bottom-bar"
      className="glass fixed inset-x-3 bottom-[calc(var(--safe-bottom)+0.5rem)] z-30 flex rounded-full p-1 md:hidden"
    >
      {items.map((item) => {
        const current = active?.url === item.url
        return (
          <Link
            key={item.url}
            href={item.url}
            aria-current={current ? "page" : undefined}
            data-active={current}
            className={cn(
              "press focus-visible:ring-ring relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-0.5 text-[10px] leading-tight font-medium outline-none focus-visible:ring-2",
              current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-[background-color,color] duration-(--motion-duration-base) ease-(--ease-standard) motion-reduce:transition-none",
                current && "bg-primary text-primary-foreground",
              )}
            >
              <NavIconView icon={item.icon} className="size-5" />
            </span>
            <span className="max-w-full text-center break-words">{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

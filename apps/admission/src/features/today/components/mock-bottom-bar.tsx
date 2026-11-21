"use client"

import { useT } from "@ihsp/i18n"
import { cn, Icons } from "@ihsp/ui"
import Link from "next/link"

const ITEMS = [
  { id: "today", href: "/preview/today/", icon: "today" },
  { id: "profile", href: "/career/", icon: "user2" },
  { id: "unis", href: "/chooser/", icon: "search" },
  { id: "essays", href: "/essays/", icon: "post" },
  { id: "apply", href: "/documents/", icon: "files" },
] as const

/**
 * MOCK of the five-slot phone bar of the new IA (Сегодня · Профиль · Вузы · Эссе · Подача). It sits exactly on top of
 * the shell's current bar and exists on the preview route only; the real bar changes with the navigation rewrite.
 */
export function MockBottomBar() {
  const t = useT("today")
  return (
    <nav
      aria-label={t("bar.label")}
      data-testid="mock-bottom-bar"
      className="bg-card/95 fixed inset-x-3 bottom-[calc(var(--safe-bottom)+0.5rem)] z-40 flex rounded-full border p-1 shadow-lg backdrop-blur md:hidden"
    >
      {ITEMS.map((item) => {
        const Icon = Icons[item.icon]
        const current = item.id === "today"
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "press focus-visible:ring-ring flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-0.5 text-[10px] leading-tight font-medium outline-none focus-visible:ring-2",
              current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span className={cn("flex size-8 items-center justify-center rounded-full", current && "bg-primary text-primary-foreground")}>
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="max-w-full text-center break-words">{t(`bar.${item.id}`)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

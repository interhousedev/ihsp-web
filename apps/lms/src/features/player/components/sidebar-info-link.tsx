"use client"

import { useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"
import Link from "next/link"
import { useCloseDrawer } from "./drawer-context"

/** "About the course" above the modules of the sidebar: same row as a lesson, an icon instead of the number. */
export function SidebarInfoLink({ href, active }: { href: string; active: boolean }) {
  const t = useT("courseLanding")
  const closeDrawer = useCloseDrawer()
  return (
    <Link
      href={href}
      prefetch={false}
      aria-current={active ? "page" : undefined}
      onClick={closeDrawer}
      className={cn(
        "relative flex min-h-11 items-center gap-2 py-2 pr-3 pl-4 text-[13px] leading-snug outline-none transition-colors lg:min-h-9",
        "hover:bg-(--stepik-chrome-hover) focus-visible:ring-2 focus-visible:ring-(--stepik-green) focus-visible:ring-inset",
        active &&
          "bg-(--stepik-green-strong) text-white hover:bg-(--stepik-green-strong) lg:after:absolute lg:after:top-1/2 lg:after:right-0 lg:after:-translate-y-1/2 lg:after:border-y-[9px] lg:after:border-r-[9px] lg:after:border-y-transparent lg:after:border-r-background lg:after:content-['']",
      )}
    >
      <span className={cn("flex w-8 shrink-0 items-center", active ? "text-white/90" : "text-(--stepik-chrome-muted)")}>
        <Icons.info aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1 truncate">{t("about")}</span>
    </Link>
  )
}

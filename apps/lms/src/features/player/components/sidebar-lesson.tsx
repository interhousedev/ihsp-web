"use client"

import { useT } from "@ihsp/i18n"
import { Icons, cn } from "@ihsp/ui"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { useCloseDrawer } from "./drawer-context"

/**
 * A lesson in the course sidebar: its number ("3.6"), the title (cut with an ellipsis, the full title is a tooltip), a
 * check when completed and a dot for new or changed lessons. The open lesson is green with a notch on the desktop
 * sidebar and carries `aria-current="step"`.
 */
export function SidebarLesson({
  number,
  title,
  href,
  active,
  completed,
  badge,
}: {
  number: string
  title: string
  href: string
  active: boolean
  completed: boolean
  badge: "new" | "changed" | "removed" | "mcp" | null
}) {
  const t = useT("player")
  const badges = useT("badges")
  const closeDrawer = useCloseDrawer()
  const ref = useRef<HTMLAnchorElement>(null)

  // The open lesson scrolls into view when the sidebar is long, and again when the sidebar opens as a drawer.
  useEffect(() => {
    if (active) ref.current?.scrollIntoView?.({ block: "nearest" })
  }, [active])

  return (
    <Link
      ref={ref}
      href={href}
      title={title}
      aria-current={active ? "step" : undefined}
      onClick={closeDrawer}
      className={cn(
        "relative flex min-h-11 items-center gap-2 py-2 pr-3 pl-4 text-[13px] leading-snug outline-none transition-colors lg:min-h-9",
        "hover:bg-(--stepik-chrome-hover) focus-visible:ring-2 focus-visible:ring-(--stepik-green) focus-visible:ring-inset",
        active &&
          "bg-(--stepik-green-strong) text-white hover:bg-(--stepik-green-strong) lg:after:absolute lg:after:top-1/2 lg:after:right-0 lg:after:-translate-y-1/2 lg:after:border-y-[9px] lg:after:border-r-[9px] lg:after:border-y-transparent lg:after:border-r-background lg:after:content-['']",
      )}
    >
      <span className={cn("w-8 shrink-0 tabular-nums", active ? "text-white/90" : "text-(--stepik-chrome-muted)")}>
        {number}
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {badge === "new" || badge === "changed" ? (
        <span
          className="size-2 shrink-0 rounded-full bg-amber-400"
          role="img"
          aria-label={badges(badge)}
          title={badges(badge)}
        />
      ) : null}
      {completed ? (
        <Icons.check aria-label={t("lessonCompleted")} role="img" className="size-4 shrink-0 text-(--stepik-green)" />
      ) : null}
    </Link>
  )
}

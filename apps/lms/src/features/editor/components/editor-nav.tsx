"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { hrefs } from "../../shared/utils/hrefs"
import { can, type CoursePermission } from "../../shared/utils/permissions"

export type EditorSection =
  | "outline"
  | "workspace"
  | "publish"
  | "versions"
  | "staff"
  | "students"
  | "preview"
  | "settings"

/** Course tools as a row of links; each shows only for staff with the matching permission. */
export function EditorNav({
  courseId,
  current,
  permissions,
}: {
  courseId: string
  current: EditorSection
  permissions: readonly CoursePermission[]
}) {
  const t = useT("editorNav")
  const scroller = useRef<HTMLElement>(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const left = Math.abs(el.scrollLeft)
    setEdges({ start: left > 1, end: left + el.clientWidth < el.scrollWidth - 1 })
  }, [])
  // Bring the open section into view, then show a fade only on the side that still has hidden tabs.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    el.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView?.({ inline: "center", block: "nearest" })
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure, current])
  const any = permissions.length > 0
  const items: { key: EditorSection; href: string; visible: boolean }[] = [
    {
      key: "outline",
      href: hrefs.edit(courseId),
      visible: can(permissions, "edit") || can(permissions, "view_drafts"),
    },
    {
      key: "workspace",
      href: hrefs.workspace(courseId),
      visible: can(permissions, "edit") || can(permissions, "view_drafts"),
    },
    { key: "preview", href: hrefs.preview(courseId), visible: can(permissions, "view_drafts") },
    { key: "publish", href: hrefs.publish(courseId), visible: can(permissions, "edit") || can(permissions, "publish") },
    { key: "versions", href: hrefs.versions(courseId), visible: any },
    { key: "staff", href: hrefs.staff(courseId), visible: any },
    { key: "settings", href: hrefs.settings(courseId), visible: can(permissions, "edit") },
    { key: "students", href: hrefs.students(courseId), visible: can(permissions, "review") },
  ]
  return (
    <div className="relative -mx-1">
      <nav
        ref={scroller}
        onScroll={measure}
        aria-label={t("label")}
        data-testid="editor-nav-scroll"
        className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max gap-1 px-4">
          {items
            .filter((item) => item.visible)
            .map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={item.key === current ? "page" : undefined}
                  className={cn(
                    "text-muted-foreground hover:bg-muted flex min-h-11 items-center rounded-lg px-3 text-sm font-medium md:min-h-8",
                    item.key === current && "bg-muted text-foreground",
                  )}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
        </ul>
      </nav>
      {edges.start ? (
        <span
          aria-hidden
          data-testid="nav-fade"
          className="from-background pointer-events-none absolute inset-y-0 start-0 w-6 bg-gradient-to-r to-transparent rtl:bg-gradient-to-l"
        />
      ) : null}
      {edges.end ? (
        <span
          aria-hidden
          data-testid="nav-fade-end"
          className="from-background pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l to-transparent rtl:bg-gradient-to-r"
        />
      ) : null}
    </div>
  )
}

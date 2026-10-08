"use client"

import { useT } from "@ihsp/i18n"
import { cn } from "@ihsp/ui"
import Link from "next/link"
import { hrefs } from "../../shared/utils/hrefs"
import { can, type CoursePermission } from "../../shared/utils/permissions"

export type EditorSection = "outline" | "publish" | "versions" | "staff" | "students" | "preview"

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
  const any = permissions.length > 0
  const items: { key: EditorSection; href: string; visible: boolean }[] = [
    {
      key: "outline",
      href: hrefs.edit(courseId),
      visible: can(permissions, "edit") || can(permissions, "view_drafts"),
    },
    { key: "preview", href: hrefs.preview(courseId), visible: can(permissions, "view_drafts") },
    { key: "publish", href: hrefs.publish(courseId), visible: can(permissions, "edit") || can(permissions, "publish") },
    { key: "versions", href: hrefs.versions(courseId), visible: any },
    { key: "staff", href: hrefs.staff(courseId), visible: any },
    { key: "students", href: hrefs.students(courseId), visible: can(permissions, "review") },
  ]
  return (
    <nav aria-label={t("label")} className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max gap-1 px-1">
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
  )
}

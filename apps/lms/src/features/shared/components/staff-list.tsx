"use client"

import type { CourseStaffItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { UserAvatar } from "@ihsp/ui"
import { personName } from "../utils/people"

/** Course staff with their role labels ("Kalandarova Gavxar — Teacher", LMS-4). */
export function StaffList({ staff }: { staff: readonly CourseStaffItem[] }) {
  const t = useT("course")
  if (staff.length === 0) return <p className="text-muted-foreground text-sm">{t("noStaff")}</p>
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {staff.map((item) => (
        <li key={item.user.id} className="flex items-center gap-3">
          <UserAvatar name={personName(item.user)} className="size-9" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{personName(item.user)}</p>
            <p className="text-muted-foreground truncate text-xs">{item.role}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

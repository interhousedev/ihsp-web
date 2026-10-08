"use client"

import type { AdminDashboard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, CardHeader, CardTitle, buttonVariants } from "@ihsp/ui"
import Link from "next/link"
import { fullName } from "../../shared/utils/names"

/** Teachers with lessons of the last days whose attendance nobody submitted (ADM-2). */
export function MissingAttendanceCard({ items }: { items: AdminDashboard["missing_attendance"] }) {
  const t = useT("dashboard")
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("missingTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("missingNone")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.teacher.id} className="flex items-center justify-between gap-2 text-sm">
                <Link
                  href={`/teachers/view/?id=${encodeURIComponent(item.teacher.id)}`}
                  className="min-w-0 truncate underline-offset-4 hover:underline"
                >
                  {fullName(item.teacher)}
                </Link>
                <Badge variant="destructive">{t("missingCount", { count: item.count })}</Badge>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/attendance/?tab=missing"
          className={buttonVariants({ variant: "outline", className: "min-h-11 w-fit md:min-h-8" })}
        >
          {t("openMissing")}
        </Link>
      </CardContent>
    </Card>
  )
}

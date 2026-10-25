"use client"

import type { BroadcastItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Card, CardContent, CardHeader, CardTitle, buttonVariants } from "@ihsp/ui"
import Link from "next/link"

/** Broadcasts that wait for their send time. */
export function ScheduledBroadcastsCard({ items }: { items: BroadcastItem[] }) {
  const t = useT("dashboard")
  const f = useFormatters()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("broadcastsTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("broadcastsNone")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                <Link
                  href={`/broadcasts/edit/?id=${encodeURIComponent(item.id)}`}
                  className="min-w-0 truncate underline-offset-4 hover:underline"
                >
                  {item.title}
                </Link>
                {item.scheduled_at ? (
                  <span className="text-muted-foreground shrink-0">{f.dateTime(item.scheduled_at)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/broadcasts/"
          className={buttonVariants({ variant: "outline", className: "min-h-11 w-fit md:min-h-8" })}
        >
          {t("openBroadcasts")}
        </Link>
      </CardContent>
    </Card>
  )
}

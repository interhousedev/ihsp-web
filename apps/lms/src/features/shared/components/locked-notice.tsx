"use client"

import type { LearningContact } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"

/** A locked course or lesson: what it is and whom to ask for access (the course lead, when the backend names one). */
export function LockedNotice({
  kind,
  contact,
  className,
}: {
  kind: "course" | "lesson"
  contact?: LearningContact | null
  className?: string
}) {
  const t = useT("access")
  return (
    <div role="status" className={className ?? "flex flex-col items-start gap-2 rounded-lg border p-4"}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Icons.lock aria-hidden className="size-4 shrink-0" />
        {kind === "course" ? t("lockedCourseTitle") : t("lockedTitle")}
      </p>
      <p className="text-muted-foreground text-sm">{t("lockedHint")}</p>
      {contact ? (
        <p className="text-sm">
          {t("contactHint", { name: contact.name })}
          {contact.telegram ? (
            <>
              {" "}
              <a
                href={`https://t.me/${contact.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {t("contactTelegram", { handle: contact.telegram.replace(/^@/, "") })}
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}

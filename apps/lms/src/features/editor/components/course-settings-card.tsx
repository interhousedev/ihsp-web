"use client"

import type { CourseDraft } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Card, CardContent } from "@ihsp/ui"
import { LinkButton } from "../../shared/components/link-button"
import { hrefs } from "../../shared/utils/hrefs"

/**
 * Visibility and status of the course, read-only here. They are changed in the course settings tab, the one editor
 * for visibility (`PATCH /settings` there), so the course has a single place to decide.
 */
export function CourseSettingsCard({ draft }: { draft: CourseDraft }) {
  const t = useT("editor")
  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">{t("settings")}</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">{t("visibility")}</dt>
            <dd className="text-sm">{draft.visibility === "invite" ? t("visibilityInvite") : t("visibilityPublic")}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground text-xs">{t("status")}</dt>
            <dd className="text-sm">{draft.status === "archived" ? t("statusArchived") : t("statusActive")}</dd>
          </div>
        </dl>
        <div>
          <LinkButton href={hrefs.settings(draft.id)} variant="outline" className="min-h-11 md:min-h-8">
            {t("openSettings")}
          </LinkButton>
        </div>
      </CardContent>
    </Card>
  )
}

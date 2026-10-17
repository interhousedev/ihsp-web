"use client"

import type { CourseSettingsView } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Badge, Card, CardContent, Icons } from "@ihsp/ui"
import { ImportImsccButton } from "../../imscc/components/import-imscc-dialog"
import { CopyCourseButton } from "../../imscc/components/copy-course-button"
import { ExportImsccButton } from "../../imscc/components/export-imscc-button"
import { LinkButton } from "../../shared/components/link-button"
import { hrefs } from "../../shared/utils/hrefs"
import { LinkCheckPanel } from "./link-check-panel"

/** Right column (below the form on phones): state, numbers, people by role and the course tools. */
export function SettingsSidebar({ settings, pollMs }: { settings: CourseSettingsView; pollMs?: number }) {
  const t = useT("courseSettings")
  const roles = Object.entries(settings.stats.staff_by_role)
  return (
    <aside aria-label={t("sidebar")} className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <Badge variant={settings.publish_state === "published" ? "default" : "outline"} className="self-start">
            {t(`states.${settings.publish_state}`)}
          </Badge>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {(["sections", "steps", "learners"] as const).map((key) => (
              <div key={key}>
                <dd className="text-xl font-semibold tabular-nums">{settings.stats[key]}</dd>
                <dt className="text-muted-foreground text-xs">{t(`stats.${key}`)}</dt>
              </div>
            ))}
          </dl>
          {roles.length > 0 ? (
            <ul aria-label={t("people")} className="text-muted-foreground flex flex-col gap-1 text-sm">
              {roles.map(([role, count]) => (
                <li key={role} className="flex justify-between">
                  <span>{role}</span>
                  <span className="tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <LinkButton href={hrefs.about(settings.slug, true)} variant="outline" className="min-h-11 md:min-h-8">
            <Icons.eye aria-hidden />
            {t("previewLearner")}
          </LinkButton>
          <ExportImsccButton courseId={settings.id} slug={settings.slug} />
          <CopyCourseButton courseId={settings.id} />
          <ImportImsccButton />
          <LinkCheckPanel courseId={settings.id} pollMs={pollMs} />
        </CardContent>
      </Card>
    </aside>
  )
}

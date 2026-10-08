"use client"

import { getLmsCourseVersionQuery, type VersionView } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { EditorFrame } from "../../editor/components/editor-frame"
import { OutlineBadge } from "../../shared/components/outline-badge"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { personName } from "../../shared/utils/people"
import { ChangeSummary } from "./change-summary"
import { LinkButton } from "../../shared/components/link-button"
import { RestoreVersionButton } from "./restore-version-button"
import { can, type CoursePermission } from "../../shared/utils/permissions"

function VersionBody({
  version,
  courseId,
  permissions,
}: {
  version: VersionView
  courseId: string
  permissions: readonly CoursePermission[]
}) {
  const t = useT("versions")
  const format = useFormatters()
  return (
    <article className="flex flex-col gap-4" aria-label={t("version", { number: version.number })}>
      <p className="text-muted-foreground text-xs">
        {format.dateTime(version.published_at)} · {personName(version.published_by)} ·{" "}
        <ChangeSummary changes={version.changes} />
      </p>
      {version.note ? <p className="text-sm break-words">{version.note}</p> : null}
      {can(permissions, "edit") ? (
        <div className="flex flex-wrap items-center gap-2">
          <RestoreVersionButton courseId={courseId} number={version.number} />
        </div>
      ) : null}
      <section className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold break-words">{version.meta.title}</h2>
        {version.meta.description ? (
          <p className="text-sm break-words whitespace-pre-line">{version.meta.description}</p>
        ) : null}
      </section>
      <ol className="flex flex-col gap-4">
        {version.outline.map((section) => (
          <li key={section.id}>
            <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
            <ul className="flex flex-col divide-y rounded-lg border">
              {section.steps.map((step) => (
                <li key={step.step_id} className="flex min-h-11 items-center gap-2 px-3 py-2 text-sm">
                  <Icons.page className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 break-words">{step.title}</span>
                  <OutlineBadge kind={step.badge} />
                </li>
              ))}
              {section.steps.length === 0 ? (
                <li className="text-muted-foreground px-3 py-2 text-sm">{t("emptySection")}</li>
              ) : null}
            </ul>
          </li>
        ))}
      </ol>
      <p className="text-muted-foreground text-xs">{t("readOnlyNote")}</p>
    </article>
  )
}

/** `/edit/versions/view/?id=&n=`: one published version, read-only. */
export function VersionViewPage({ courseId, number }: { courseId: string; number: number }) {
  const t = useT("versions")
  const version = useQuery(getLmsCourseVersionQuery(courseId, number))
  return (
    <EditorFrame
      courseId={courseId}
      current="versions"
      title={t("version", { number })}
      actions={
        <LinkButton href={hrefs.versions(courseId)} variant="outline" className="min-h-11 md:min-h-8">
          <Icons.chevronLeft aria-hidden />
          {t("backToVersions")}
        </LinkButton>
      }
    >
      {(permissions) => (
        <QueryState query={version} rows={3}>
          {(data) => <VersionBody version={data} courseId={courseId} permissions={permissions} />}
        </QueryState>
      )}
    </EditorFrame>
  )
}

"use client"

import { getLmsCourseQuery, type CoursePage as CoursePageData } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons, PageContainer, Progress } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { StaffList } from "../../shared/components/staff-list"
import { hrefs } from "../../shared/utils/hrefs"
import { continueStep } from "../../shared/utils/outline"
import { useEnroll } from "../hooks/use-enroll"
import { CourseOutline } from "./course-outline"
import { LinkButton } from "../../shared/components/link-button"

function CourseBody({ page }: { page: CoursePageData }) {
  const t = useT("course")
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const enroll = useEnroll(page.slug)
  const next = continueStep(page.outline)
  const changedCount = page.changed_since_last_visit.length
  const canOpenSteps = page.enrolled || page.can_edit

  return (
    <div className="flex flex-col gap-6">
      {page.cover_url ? <img src={page.cover_url} alt="" className="max-h-56 w-full rounded-lg object-cover" /> : null}

      <div className="flex flex-wrap items-center gap-2">
        {page.enrolled && next ? (
          <LinkButton href={hrefs.step(page.id, next.step_id, page.slug)} className="min-h-11 md:min-h-8">
            {t("continue")}
          </LinkButton>
        ) : null}
        {!page.enrolled && page.visibility === "public" ? (
          <Button onClick={() => enroll.mutate(page.id)} disabled={enroll.isPending} className="min-h-11 md:min-h-8">
            {t("enroll")}
          </Button>
        ) : null}
        {!page.enrolled && page.visibility === "invite" ? (
          <LinkButton href={hrefs.join()} variant="outline" className="min-h-11 md:min-h-8">
            {t("enterCode")}
          </LinkButton>
        ) : null}
        {page.can_edit ? (
          <>
            <LinkButton href={hrefs.edit(page.id)} variant="outline" className="min-h-11 md:min-h-8">
              <Icons.edit aria-hidden />
              {t("edit")}
            </LinkButton>
            <LinkButton href={hrefs.preview(page.id)} variant="outline" className="min-h-11 md:min-h-8">
              {t("previewDraft")}
            </LinkButton>
          </>
        ) : null}
      </div>

      {enroll.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(enroll.error)}</AlertDescription>
        </Alert>
      ) : null}

      {page.enrolled && page.progress_pct !== null ? (
        <Progress value={page.progress_pct} aria-label={t("progress")}>
          <span className="text-sm font-medium">{t("progress")}</span>
          <span className="text-muted-foreground ms-auto text-sm tabular-nums">{page.progress_pct}%</span>
        </Progress>
      ) : null}

      {page.enrolled && changedCount > 0 && page.updated_at ? (
        <Alert>
          <Icons.info aria-hidden />
          <AlertDescription>
            {t("updatedNote", { date: format.date(page.updated_at), count: changedCount })}
          </AlertDescription>
        </Alert>
      ) : page.updated_at ? (
        <p className="text-muted-foreground text-xs">{t("lastUpdated", { date: format.date(page.updated_at) })}</p>
      ) : null}

      {page.description ? (
        <p className="text-sm leading-relaxed break-words whitespace-pre-line">{page.description}</p>
      ) : null}

      <section aria-labelledby="course-staff" className="flex flex-col gap-3">
        <h2 id="course-staff" className="text-lg font-semibold">
          {t("staff")}
        </h2>
        <StaffList staff={page.staff} />
      </section>

      <section aria-labelledby="course-outline" className="flex flex-col gap-3">
        <h2 id="course-outline" className="text-lg font-semibold">
          {t("outline")}
        </h2>
        <CourseOutline page={page} linkSteps={canOpenSteps} />
      </section>
    </div>
  )
}

/** `/course/?slug=`: description, outline with completion and "new / changed" marks, staff, Enroll or Continue. */
export function CoursePage({ slug }: { slug: string }) {
  const t = useT("course")
  const page = useQuery(getLmsCourseQuery(slug))
  return (
    <PageContainer title={page.data?.title ?? t("title")}>
      <QueryState query={page} rows={4}>
        {(data) => <CourseBody page={data} />}
      </QueryState>
    </PageContainer>
  )
}

"use client"

import type { CoursePage } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Card, CardContent, Icons, Progress, Spinner } from "@ihsp/ui"
import { CourseCover } from "../../shared/components/course-cover"
import { LinkButton } from "../../shared/components/link-button"
import { courseProgress, formatPoints } from "../../shared/utils/course-progress"
import { hrefs } from "../../shared/utils/hrefs"
import { continueStep } from "../../shared/utils/outline"
import { useEnroll } from "../hooks/use-enroll"

const CTA = "min-h-11 w-full text-base font-semibold"

/**
 * The side card of the course page, like Stepik's: the cover, the big green button (Join course, or Continue once
 * enrolled), the progress of an enrolled student, the size of the course and the staff's Edit and Preview links.
 */
export function CoursePromoCard({ page }: { page: CoursePage }) {
  const t = useT("course")
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const enroll = useEnroll(page.slug)
  const next = continueStep(page.outline)
  const progress = courseProgress(page)

  return (
    <Card className="gap-0 overflow-hidden pt-0">
      <CourseCover title={page.title} url={page.cover_url} eager />
      <CardContent className="flex flex-col gap-4 pt-4">
        {page.enrolled && progress ? (
          <Progress value={progress.percent} aria-label={t("progress")} className="gap-1.5">
            <span className="text-sm font-medium">{t("yourProgress")}</span>
            <span className="text-muted-foreground ms-auto text-sm tabular-nums">
              {progress.kind === "points"
                ? t("progressPoints", {
                    earned: formatPoints(progress.earned, format.locale),
                    total: formatPoints(progress.total, format.locale),
                  })
                : `${progress.percent}%`}
            </span>
          </Progress>
        ) : null}

        {page.enrolled && next ? (
          <LinkButton href={hrefs.step(page.id, next.step_id, page.slug)} className={CTA}>
            {t("continue")}
          </LinkButton>
        ) : null}
        {!page.enrolled && page.visibility === "public" ? (
          <Button onClick={() => enroll.mutate(page.id)} disabled={enroll.isPending} className={CTA}>
            {enroll.isPending ? <Spinner aria-hidden /> : null}
            {t("enroll")}
          </Button>
        ) : null}
        {!page.enrolled && page.visibility === "invite" ? (
          <LinkButton href={hrefs.join()} className={CTA}>
            {t("enterCode")}
          </LinkButton>
        ) : null}
        {enroll.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage(enroll.error)}</AlertDescription>
          </Alert>
        ) : null}

        <ul aria-label={t("facts")} className="text-muted-foreground flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-2">
            <Icons.subjects aria-hidden className="size-4 shrink-0" />
            {t("lessons", { count: page.steps_count })}
          </li>
          {page.points_total > 0 ? (
            <li className="flex items-center gap-2">
              <Icons.exclusive aria-hidden className="size-4 shrink-0" />
              {t("points", { count: page.points_total })}
            </li>
          ) : null}
          {page.visibility === "invite" ? (
            <li className="flex items-center gap-2">
              <Icons.lock aria-hidden className="size-4 shrink-0" />
              {t("invite")}
            </li>
          ) : null}
          {page.updated_at ? (
            <li className="flex items-center gap-2">
              <Icons.calendar aria-hidden className="size-4 shrink-0" />
              {t("lastUpdated", { date: format.date(page.updated_at) })}
            </li>
          ) : null}
        </ul>

        {page.can_edit ? (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            <LinkButton href={hrefs.edit(page.id)} variant="outline" className="min-h-11 md:min-h-8">
              <Icons.edit aria-hidden />
              {t("edit")}
            </LinkButton>
            <LinkButton href={hrefs.preview(page.id)} variant="outline" className="min-h-11 md:min-h-8">
              {t("previewDraft")}
            </LinkButton>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

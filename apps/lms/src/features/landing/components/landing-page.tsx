"use client"

import { getLmsCourseLandingQuery, lmsLandingKey, type CourseLanding } from "@ihsp/api"
import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Badge, Icons, LoadingButton, PageContainer, UserAvatar } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useEnroll } from "../../courses/hooks/use-enroll"
import { CourseCover } from "../../shared/components/course-cover"
import { LinkButton } from "../../shared/components/link-button"
import { QueryState } from "../../shared/components/query-state"
import { StepikScope } from "../../shared/components/stepik-scope"
import { hrefs } from "../../shared/utils/hrefs"
import { accentStyle } from "../../settings/utils/color"

function List({ id, title, items }: { id: string; title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="text-xl font-semibold">
        {title}
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm">
            <Icons.check
              aria-hidden
              className="mt-0.5 size-4 shrink-0"
              style={{ color: "var(--course-accent, currentColor)" }}
            />
            <span className="break-words">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Chips({ landing }: { landing: CourseLanding }) {
  const t = useT("courseLanding")
  const chips = [
    landing.level ? t(`levels.${landing.level}`) : null,
    t(`languages.${landing.language}`),
    landing.workload_hours_per_week ? t("workload", { count: landing.workload_hours_per_week }) : null,
    landing.duration_weeks ? t("duration", { count: landing.duration_weeks }) : null,
  ].filter((chip): chip is string => chip !== null)
  return (
    <ul aria-label={t("facts")} className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip}>
          <Badge variant="outline" className="min-h-7 px-3">
            {chip}
          </Badge>
        </li>
      ))}
    </ul>
  )
}

function EnrolBox({ landing }: { landing: CourseLanding }) {
  const t = useT("courseLanding")
  const format = useFormatters()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const enroll = useEnroll(landing.slug)
  const { enrolment } = landing
  const style = {
    backgroundColor: "var(--course-accent, var(--primary))",
    color: "var(--course-accent-fg, var(--primary-foreground))",
  }
  if (enrolment.enrolled) {
    return (
      <LinkButton href={hrefs.course(landing.slug)} style={style} className="min-h-11 w-full text-base font-semibold">
        {t("continue")}
      </LinkButton>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <LoadingButton
        disabled={landing.preview || !enrolment.can_enrol}
        loading={enroll.isPending}
        style={style}
        className="min-h-11 w-full text-base font-semibold"
        onClick={() =>
          enroll.mutate(landing.id, {
            onSuccess: () => {
              toast.success(t("enrolled"))
              void queryClient.invalidateQueries({ queryKey: lmsLandingKey(landing.slug, false) })
            },
          })
        }
      >
        {t("enrol")}
      </LoadingButton>
      {!enrolment.can_enrol && !landing.preview ? (
        <p className="text-muted-foreground text-sm">
          {enrolment.open
            ? enrolment.starts_at
              ? t("opensOn", { date: format.date(enrolment.starts_at) })
              : t("closedFor")
            : t("closed")}
        </p>
      ) : null}
      {enrolment.ends_at && enrolment.can_enrol ? (
        <p className="text-muted-foreground text-sm">{t("endsOn", { date: format.date(enrolment.ends_at) })}</p>
      ) : null}
      {enroll.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(enroll.error)}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

function Body({ landing }: { landing: CourseLanding }) {
  const t = useT("courseLanding")
  return (
    <div style={accentStyle(landing.accent_color)} className="flex flex-col gap-6">
      {landing.preview ? (
        <Alert>
          <Icons.eye aria-hidden />
          <AlertDescription>{t("previewBanner")}</AlertDescription>
        </Alert>
      ) : null}
      {landing.banner_url ? (
        <img src={landing.banner_url} alt="" className="aspect-[5/1] w-full rounded-xl object-cover" />
      ) : (
        <div
          aria-hidden
          className="h-2 w-full rounded-full"
          style={{ backgroundColor: "var(--course-accent, var(--border))" }}
        />
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="order-last flex min-w-0 flex-col gap-8 lg:order-first">
          {landing.summary ? <p className="text-base leading-relaxed break-words">{landing.summary}</p> : null}
          <Chips landing={landing} />
          {landing.description ? (
            <section aria-labelledby="landing-about" className="flex flex-col gap-3">
              <h2 id="landing-about" className="text-xl font-semibold">
                {t("about")}
              </h2>
              <p className="text-sm leading-relaxed break-words whitespace-pre-line">{landing.description}</p>
            </section>
          ) : null}
          <List id="landing-outcomes" title={t("outcomes")} items={landing.outcomes} />
          <List id="landing-requirements" title={t("requirements")} items={landing.requirements} />
          <List id="landing-audience" title={t("audience")} items={landing.audience} />
          {landing.syllabus.length > 0 ? (
            <section aria-labelledby="landing-syllabus" className="flex flex-col gap-3">
              <h2 id="landing-syllabus" className="text-xl font-semibold">
                {t("syllabus")}
              </h2>
              <ol className="flex flex-col gap-3">
                {landing.syllabus.map((section, index) => (
                  <li key={`${section.title}-${index}`}>
                    <details className="group rounded-lg border">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-4 py-2 [&::-webkit-details-marker]:hidden">
                        <Icons.chevronRight
                          aria-hidden
                          className="text-muted-foreground size-4 transition-transform group-open:rotate-90"
                        />
                        <span className="min-w-0 flex-1 text-sm font-semibold break-words">
                          <span className="text-muted-foreground me-2 tabular-nums">{index + 1}</span>
                          {section.title}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs">
                          {t("lessons", { count: section.steps.length })}
                        </span>
                      </summary>
                      <ul className="flex flex-col divide-y border-t">
                        {section.steps.map((step, at) => (
                          <li key={`${step.title}-${at}`} className="px-4 py-3 text-sm break-words">
                            {step.title}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {landing.authors.length > 0 ? (
            <section aria-labelledby="landing-authors" className="flex flex-col gap-3">
              <h2 id="landing-authors" className="text-xl font-semibold">
                {t("authors")}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {landing.authors.map(({ user, role }) => (
                  <li key={user.id} className="flex items-center gap-3">
                    <UserAvatar name={`${user.last_name} ${user.first_name}`} className="size-9" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {user.last_name} {user.first_name}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">{role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        <div className="order-first overflow-hidden rounded-xl border lg:sticky lg:top-4 lg:order-last">
          <CourseCover title={landing.title} url={landing.cover_url} accent={landing.accent_color} eager />
          <div className="p-4">
            <EnrolBox landing={landing} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** `/course/about/?slug=&preview=1`: the Stepik-style landing page of a course for learners who are not in it yet. */
export function LandingPage({ slug, preview }: { slug: string; preview: boolean }) {
  const landing = useQuery(getLmsCourseLandingQuery(slug, preview))
  return (
    <StepikScope>
      <PageContainer title={landing.data?.friendly_name || landing.data?.title || slug}>
        <QueryState query={landing} rows={4}>
          {(data) => <Body landing={data} />}
        </QueryState>
      </PageContainer>
    </StepikScope>
  )
}

"use client"

import { NotebookWorkspace, useOpenCourseNotebook } from "@ihsp/features-core"
import {
  getLmsCourseLandingQuery,
  getLmsCourseQuery,
  type CourseLanding,
  type CoursePage as CoursePageData,
} from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Icons,
  PageContainer,
  ScrollList,
  Skeleton,
  StateView,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useEffect, useRef } from "react"
import { LandingAbout, LandingAuthors, LandingEnrolBox, LandingSyllabus } from "../../landing/components/landing-page"
import { LinkButton } from "../../shared/components/link-button"
import { OutlineBadge } from "../../shared/components/outline-badge"
import { StaffList } from "../../shared/components/staff-list"
import { StepikScope } from "../../shared/components/stepik-scope"
import { accentStyle } from "../../settings/utils/color"
import { courseProgress, formatPoints } from "../../shared/utils/course-progress"
import { notebookHref } from "../../notebooks/utils/hrefs"
import { CourseOutline } from "./course-outline"
import { CoursePromoCard } from "./course-promo-card"

/** The tabs of the course page, in Stepik's order. The learner tabs show only to enrolled students. */
const TABS = ["about", "syllabus", "staff", "progress", "updates", "notebook", "ai"] as const
type Tab = (typeof TABS)[number]
const LEARNER_TABS: readonly Tab[] = ["progress", "updates", "notebook", "ai"]
const tabParser = parseAsStringLiteral(TABS).withDefault("about")

/** The page frame while the course loads: a title-sized skeleton instead of a placeholder heading, then the rows. */
function CoursePageLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 pt-2 pb-6 md:px-6 md:pt-4" aria-busy="true">
      <Skeleton className="h-8 w-2/3 rounded-md md:h-9" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  )
}

/** Progress tab: the lessons completed and, when the course has tests, the points earned. */
export function ProgressTab({ course }: { course: CoursePageData }) {
  const t = useT("course")
  const format = useFormatters()
  const progress = courseProgress(course)
  if (!progress) return <p className="text-muted-foreground text-sm">{t("progressEmpty")}</p>
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm tabular-nums">{t("progressLessons", { done: progress.done, total: progress.total })}</p>
      {progress.points ? (
        <p className="text-sm tabular-nums">
          {t("progressPoints", {
            earned: formatPoints(progress.points.earned, format.locale),
            total: formatPoints(progress.points.total, format.locale),
          })}
        </p>
      ) : null}
    </div>
  )
}

/** Updates tab: the lessons that are new or changed since the student's last visit (no announcements API exists). */
export function UpdatesTab({ course }: { course: CoursePageData }) {
  const t = useT("course")
  const format = useFormatters()
  const changed = course.outline.flatMap((section) =>
    section.steps
      .filter((step) => step.badge === "new" || step.badge === "changed")
      .map((step) => ({ key: step.step_id, title: step.title, badge: step.badge })),
  )
  if (changed.length === 0) return <p className="text-muted-foreground text-sm">{t("updatesEmpty")}</p>
  return (
    <div className="flex flex-col gap-2">
      {course.updated_at ? (
        <p className="text-muted-foreground text-xs">{t("lastUpdated", { date: format.date(course.updated_at) })}</p>
      ) : null}
      <ScrollList label={t("updatesLabel")}>
        <ul className="flex flex-col divide-y">
          {changed.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 break-words">{item.title}</span>
              <OutlineBadge kind={item.badge} />
            </li>
          ))}
        </ul>
      </ScrollList>
    </div>
  )
}

/**
 * Notebook tab: the student's course notebook (get-or-create, the same one the course sources use), embedded. The
 * workspace keeps its own query parameters, so the notebook opens inside this page rather than in another one.
 */
function NotebookTab({ notebookId, failed }: { notebookId: string | null; failed: boolean }) {
  const t = useT("course")
  if (failed) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t("notebookFailed")}</AlertDescription>
      </Alert>
    )
  }
  if (notebookId === null) return <Skeleton className="h-96 w-full rounded-xl" />
  return (
    <div className="h-[70dvh] min-h-96 overflow-hidden rounded-xl border">
      <NotebookWorkspace notebookId={notebookId} />
    </div>
  )
}

/**
 * AI chat tab. The student assistant has no course scope (it takes no course), so the nearest course-scoped chat is the
 * course notebook's chat, which answers from the course materials; this tab links to it.
 */
function ChatTab({ notebookId }: { notebookId: string | null }) {
  const t = useT("course")
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{t("aiNote")}</p>
      {notebookId !== null ? (
        <LinkButton href={notebookHref(notebookId)} className="min-h-11 self-start">
          {t("aiOpen")}
        </LinkButton>
      ) : (
        <Skeleton className="h-11 w-48 rounded-md" />
      )}
    </div>
  )
}

/** Syllabus and Staff: the course page's lists when the viewer is enrolled or a teacher; the landing's otherwise. */
function CourseBody({
  course,
  landing,
  enrolled,
  tab,
  notebook,
}: {
  course: CoursePageData | undefined
  landing: CourseLanding | undefined
  enrolled: boolean
  tab: Tab
  notebook: ReturnType<typeof useOpenCourseNotebook>
}) {
  const t = useT("course")
  const notebookId = notebook.data?.id ?? null
  const available = enrolled ? TABS : TABS.filter((key) => !LEARNER_TABS.includes(key))
  const active: Tab = available.includes(tab) ? tab : "about"
  const [, setTab] = useQueryState("tab", tabParser)

  return (
    <Tabs value={active} onValueChange={(value) => void setTab(value as Tab)} className="min-w-0 flex-1">
      <TabsList variant="line" aria-label={t("tabsLabel")} className="max-w-full justify-start overflow-x-auto">
        {available.map((key) => (
          <TabsTrigger key={key} value={key} className="min-h-11 shrink-0 md:min-h-8">
            {t(`tabs.${key}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="about" className="pt-4">
        {landing ? (
          <LandingAbout landing={landing} />
        ) : (
          <p className="text-sm leading-relaxed break-words whitespace-pre-line">{course?.description}</p>
        )}
      </TabsContent>
      <TabsContent value="syllabus" className="pt-4">
        {course ? (
          <CourseOutline page={course} linkSteps={enrolled || course.can_edit} />
        ) : landing ? (
          <LandingSyllabus landing={landing} />
        ) : null}
      </TabsContent>
      <TabsContent value="staff" className="pt-4">
        {course ? <StaffList staff={course.staff} /> : landing ? <LandingAuthors landing={landing} /> : null}
      </TabsContent>
      {enrolled && course ? (
        <>
          <TabsContent value="progress" className="pt-4">
            <ProgressTab course={course} />
          </TabsContent>
          <TabsContent value="updates" className="pt-4">
            <UpdatesTab course={course} />
          </TabsContent>
          <TabsContent value="notebook" className="pt-4">
            <NotebookTab notebookId={notebookId} failed={notebook.isError} />
          </TabsContent>
          <TabsContent value="ai" className="pt-4">
            <ChatTab notebookId={notebookId} />
          </TabsContent>
        </>
      ) : null}
    </Tabs>
  )
}

/**
 * `/course/?slug=`: the one course page, like Stepik's. Tabs (About, Syllabus, Staff, and for enrolled students Progress
 * and points, Updates, Notebook, AI chat) live in the `tab` query parameter. `preview=1` shows the page as learners who
 * are not enrolled see it, from the landing data only (a draft has no course page).
 */
export function CoursePage({ slug, preview = false }: { slug: string; preview?: boolean }) {
  const t = useT("course")
  const tLanding = useT("courseLanding")
  const [tab] = useQueryState("tab", tabParser)
  const landing = useQuery(getLmsCourseLandingQuery(slug, preview))
  const page = useQuery({ ...getLmsCourseQuery(slug), enabled: !preview })
  const course = preview ? undefined : page.data
  const info = landing.data
  const enrolled = course?.enrolled ?? info?.enrolment.enrolled ?? false
  const openNotebook = useOpenCourseNotebook()
  const { mutate: openCourseNotebook } = openNotebook
  const asked = useRef(false)
  const wantsNotebook = enrolled && (tab === "notebook" || tab === "ai")
  const courseId = course?.id ?? null

  // The course notebook is created on first use (get-or-create), then reused by both the Notebook and AI chat tabs.
  useEffect(() => {
    if (!wantsNotebook || courseId === null || asked.current) return
    asked.current = true
    openCourseNotebook(courseId)
  }, [wantsNotebook, courseId, openCourseNotebook])

  // The course page is the primary source; the landing only adds the About text, so its failure is not fatal.
  // In preview the landing is the only source.
  const primary = preview ? landing : page
  if (primary.isPending) {
    return (
      <StepikScope>
        <CoursePageLoading />
      </StepikScope>
    )
  }
  if (primary.isError) {
    return (
      <StepikScope>
        <PageContainer title={t("title")}>
          <StateView state="error" error={primary.error} onRetry={() => void primary.refetch()} />
        </PageContainer>
      </StepikScope>
    )
  }

  const title = info?.friendly_name || info?.title || course?.title || t("title")
  return (
    <StepikScope>
      <PageContainer title={title}>
        <div style={accentStyle(info?.accent_color ?? course?.accent_color)} className="flex min-w-0 flex-col gap-6">
          {info?.preview ? (
            <Alert>
              <Icons.eye aria-hidden />
              <AlertDescription>{tLanding("previewBanner")}</AlertDescription>
            </Alert>
          ) : null}
          {course && enrolled && course.changed_since_last_visit.length > 0 && course.updated_at ? (
            <Alert>
              <Icons.info aria-hidden />
              <AlertDescription>
                {t("updatedNote", { count: course.changed_since_last_visit.length, date: course.updated_at })}
              </AlertDescription>
            </Alert>
          ) : null}
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <CourseBody course={course} landing={info} enrolled={enrolled} tab={tab} notebook={openNotebook} />
            <div className="order-first lg:sticky lg:top-16 lg:order-last">
              {course ? (
                <CoursePromoCard page={course} />
              ) : info ? (
                <div className="overflow-hidden rounded-xl border p-4">
                  <LandingEnrolBox landing={info} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </PageContainer>
    </StepikScope>
  )
}

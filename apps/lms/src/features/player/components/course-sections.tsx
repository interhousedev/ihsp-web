"use client"

import { NotebookWorkspace, useOpenCourseNotebook } from "@ihsp/features-core"
import { getLmsCourseLandingQuery, type CoursePage } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useEffect, useRef, type ReactNode } from "react"
import { CourseOutline } from "../../courses/components/course-outline"
import { ProgressTab, UpdatesTab } from "../../courses/components/course-page"
import { CoursePromoCard } from "../../courses/components/course-promo-card"
import { LandingAbout } from "../../landing/components/landing-page"
import { StaffList } from "../../shared/components/staff-list"

const COURSE_TABS = ["about", "syllabus", "staff", "progress", "updates", "notebook", "ai"] as const
type CourseTab = (typeof COURSE_TABS)[number]
const LEARNER_TABS: readonly CourseTab[] = ["progress", "updates", "notebook", "ai"]
const LESSON = "lesson"
const tabParser = parseAsStringLiteral([LESSON, ...COURSE_TABS])

/**
 * The strip of the unified course page: the open lesson first, then what used to be the tabs of the course page. The
 * choice lives in `?tab=` and a lesson link drops it, so choosing a lesson returns to the lesson. Below 768 px the strip
 * scrolls sideways. The Notebook takes the whole area under the strip.
 */
export function CourseSections({ course, lesson }: { course: CoursePage | null; lesson: ReactNode }) {
  const t = useT("course")
  const player = useT("player")
  const [tab, setTab] = useQueryState("tab", tabParser)
  const enrolled = course?.enrolled ?? false
  const available = enrolled ? COURSE_TABS : COURSE_TABS.filter((key) => !LEARNER_TABS.includes(key))
  const active = tab !== null && tab !== LESSON && available.includes(tab) ? tab : LESSON

  const landing = useQuery({
    ...getLmsCourseLandingQuery(course?.slug ?? "", false),
    enabled: course !== null && active === "about",
  })

  const notebook = useOpenCourseNotebook()
  const { mutate: openNotebook } = notebook
  const asked = useRef(false)
  const courseId = course?.id ?? null
  useEffect(() => {
    if (active !== "notebook" || courseId === null || asked.current) return
    asked.current = true
    openNotebook(courseId)
  }, [active, courseId, openNotebook])

  return (
    <Tabs
      value={active}
      onValueChange={(value) => void setTab(value === LESSON ? null : (value as CourseTab))}
      className="flex h-full min-h-0 flex-col gap-0"
    >
      <TabsList
        variant="line"
        aria-label={t("tabsLabel")}
        className="bg-background w-full shrink-0 justify-start overflow-x-auto border-b px-2"
      >
        <TabsTrigger value={LESSON} className="min-h-11 flex-none md:min-h-8">
          {player("lesson")}
        </TabsTrigger>
        {available.map((key) => (
          <TabsTrigger key={key} value={key} className="min-h-11 flex-none md:min-h-8">
            {t(`tabs.${key}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      {active === "notebook" ? (
        <TabsContent value="notebook" className="min-h-0 flex-1 overflow-hidden">
          {notebook.isError ? (
            <Alert variant="destructive" className="m-4 w-auto">
              <AlertDescription>{t("notebookFailed")}</AlertDescription>
            </Alert>
          ) : notebook.data ? (
            <NotebookWorkspace notebookId={notebook.data.id} />
          ) : (
            <Skeleton className="m-4 h-96 rounded-xl" />
          )}
        </TabsContent>
      ) : (
        <TabsContent value={active} className="min-h-0 flex-1 overflow-y-auto">
          {active === LESSON ? (
            lesson
          ) : course ? (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 md:px-6">
              {active === "about" ? (
                <>
                  {landing.data ? (
                    <LandingAbout landing={landing.data} />
                  ) : (
                    <p className="text-sm leading-relaxed break-words whitespace-pre-line">{course.description}</p>
                  )}
                  <div className="w-full max-w-sm">
                    <CoursePromoCard page={course} />
                  </div>
                </>
              ) : null}
              {active === "syllabus" ? <CourseOutline page={course} linkSteps /> : null}
              {active === "staff" ? <StaffList staff={course.staff} /> : null}
              {active === "progress" ? <ProgressTab course={course} /> : null}
              {active === "updates" ? <UpdatesTab course={course} /> : null}
              {active === "ai" ? (
                <div className="flex flex-col gap-3">
                  <p className="text-muted-foreground text-sm">{t("aiNote")}</p>
                  <Button className="min-h-11 self-start" onClick={() => void setTab("notebook")}>
                    {t("aiOpen")}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </TabsContent>
      )}
    </Tabs>
  )
}

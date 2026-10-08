"use client"

import { getLmsCourseQuery, type CoursePage as CoursePageData } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Icons, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { StaffList } from "../../shared/components/staff-list"
import { StepikScope } from "../../shared/components/stepik-scope"
import { CourseOutline } from "./course-outline"
import { CoursePromoCard } from "./course-promo-card"

function CourseBody({ page }: { page: CoursePageData }) {
  const t = useT("course")
  const format = useFormatters()
  const changedCount = page.changed_since_last_visit.length
  const canOpenSteps = page.enrolled || page.can_edit

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="order-last flex min-w-0 flex-col gap-8 lg:order-first">
        {page.enrolled && changedCount > 0 && page.updated_at ? (
          <Alert>
            <Icons.info aria-hidden />
            <AlertDescription>
              {t("updatedNote", { date: format.date(page.updated_at), count: changedCount })}
            </AlertDescription>
          </Alert>
        ) : null}

        {page.description ? (
          <section aria-labelledby="course-about" className="flex flex-col gap-3">
            <h2 id="course-about" className="text-xl font-semibold">
              {t("aboutCourse")}
            </h2>
            <p className="text-sm leading-relaxed break-words whitespace-pre-line">{page.description}</p>
          </section>
        ) : null}

        <section aria-labelledby="course-outline" className="flex flex-col gap-3">
          <h2 id="course-outline" className="text-xl font-semibold">
            {t("syllabus")}
          </h2>
          <CourseOutline page={page} linkSteps={canOpenSteps} />
        </section>

        <section aria-labelledby="course-staff" className="flex flex-col gap-3">
          <h2 id="course-staff" className="text-xl font-semibold">
            {t("staff")}
          </h2>
          <StaffList staff={page.staff} />
        </section>
      </div>
      <div className="order-first lg:sticky lg:top-4 lg:order-last">
        <CoursePromoCard page={page} />
      </div>
    </div>
  )
}

/**
 * `/course/?slug=`: the promo page of a course, like Stepik's: the title, the about text, the syllabus with completion
 * and "new / changed" marks, the staff, and a side card with the Join course or Continue button.
 */
export function CoursePage({ slug }: { slug: string }) {
  const t = useT("course")
  const page = useQuery(getLmsCourseQuery(slug))
  return (
    <StepikScope>
      <PageContainer title={page.data?.title ?? t("title")}>
        <QueryState query={page} rows={4}>
          {(data) => <CourseBody page={data} />}
        </QueryState>
      </PageContainer>
    </StepikScope>
  )
}

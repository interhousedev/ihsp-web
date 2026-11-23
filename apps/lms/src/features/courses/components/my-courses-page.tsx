"use client"

import { getLmsMyCoursesQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer, StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { CourseCardView } from "../../shared/components/course-card-view"
import { EngagementPanel } from "../../engagement/components/engagement-panel"
import { QueryState } from "@ihsp/features-core"
import { StepikScope } from "../../shared/components/stepik-scope"
import { hrefs } from "../../shared/utils/hrefs"
import { LinkButton } from "../../shared/components/link-button"
import { MyCertificateCard } from "../../certificates/components/my-certificate-card"

/** `/my/`: enrolled courses with progress and the courses the user manages. */
export function MyCoursesPage() {
  const t = useT("my")
  const tCert = useT("courseCertificates")
  const courses = useQuery(getLmsMyCoursesQuery())
  return (
    <StepikScope>
      <PageContainer title={t("title")}>
        <QueryState
          query={courses}
          isEmpty={(data) => data.enrolled.length === 0 && data.managed.length === 0}
          emptyText={t("empty")}
          emptyAction={
            <LinkButton href={hrefs.catalog()} className="min-h-11 md:min-h-8">
              {t("browse")}
            </LinkButton>
          }
        >
          {(data) => (
            <div className="flex flex-col gap-8">
              {data.enrolled.length > 0 ? <EngagementPanel /> : null}
              <section aria-labelledby="my-enrolled" className="flex flex-col gap-3">
                <h2 id="my-enrolled" className="text-lg font-semibold">
                  {t("enrolled")}
                </h2>
                {data.enrolled.length === 0 ? (
                  <StateView state="empty" emptyText={t("noneEnrolled")} />
                ) : (
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {data.enrolled.map((course) => (
                      <li key={course.id} className="flex">
                        <CourseCardView
                          course={course}
                          className="w-full"
                          actions={
                            <>
                              <LinkButton
                                href={hrefs.course(course.slug)}
                                className="min-h-11 font-semibold md:min-h-8"
                              >
                                {t("open")}
                              </LinkButton>
                              <LinkButton
                                href={hrefs.mastery(course.id)}
                                variant="outline"
                                className="min-h-11 md:min-h-8"
                              >
                                {t("mastery")}
                              </LinkButton>
                            </>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              {data.enrolled.length > 0 ? (
                <section
                  aria-labelledby="my-certificates"
                  className="flex flex-col gap-3 [&:not(:has([data-testid=my-certificate]))]:hidden"
                >
                  <h2 id="my-certificates" className="text-lg font-semibold">
                    {tCert("mine.sectionTitle")}
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {data.enrolled.map((course) => (
                      <li key={course.id} className="empty:hidden">
                        <MyCertificateCard courseId={course.id} courseTitle={course.title} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {data.managed.length > 0 ? (
                <section aria-labelledby="my-managed" className="flex flex-col gap-3">
                  <h2 id="my-managed" className="text-lg font-semibold">
                    {t("managed")}
                  </h2>
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {data.managed.map((course) => (
                      <li key={course.id} className="flex">
                        <CourseCardView
                          course={course}
                          className="w-full"
                          actions={
                            <>
                              <LinkButton href={hrefs.edit(course.id)} size="sm" className="min-h-11 md:min-h-7">
                                {t("edit")}
                              </LinkButton>
                              <LinkButton
                                href={hrefs.course(course.slug)}
                                size="sm"
                                variant="outline"
                                className="min-h-11 md:min-h-7"
                              >
                                {t("view")}
                              </LinkButton>
                            </>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          )}
        </QueryState>
      </PageContainer>
    </StepikScope>
  )
}

"use client"

import { getLmsMyCoursesQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { CourseCardView } from "../../shared/components/course-card-view"
import { QueryState } from "../../shared/components/query-state"
import { hrefs } from "../../shared/utils/hrefs"
import { LinkButton } from "../../shared/components/link-button"

/** `/my/`: enrolled courses with progress and the courses the user manages. */
export function MyCoursesPage() {
  const t = useT("my")
  const courses = useQuery(getLmsMyCoursesQuery())
  return (
    <PageContainer title={t("title")} description={t("description")}>
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
            <section aria-labelledby="my-enrolled" className="flex flex-col gap-3">
              <h2 id="my-enrolled" className="text-lg font-semibold">
                {t("enrolled")}
              </h2>
              {data.enrolled.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("noneEnrolled")}</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.enrolled.map((course) => (
                    <li key={course.id} className="flex">
                      <CourseCardView
                        course={course}
                        className="w-full"
                        actions={
                          <LinkButton href={hrefs.course(course.slug)} size="sm" className="min-h-11 md:min-h-7">
                            {t("open")}
                          </LinkButton>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {data.managed.length > 0 ? (
              <section aria-labelledby="my-managed" className="flex flex-col gap-3">
                <h2 id="my-managed" className="text-lg font-semibold">
                  {t("managed")}
                </h2>
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
  )
}

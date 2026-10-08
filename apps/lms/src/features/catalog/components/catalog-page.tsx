"use client"

import { getLmsCoursesQuery } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Icons, Input, PageContainer, useDebounce } from "@ihsp/ui"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { CourseCardView } from "../../shared/components/course-card-view"
import { QueryState } from "../../shared/components/query-state"
import { StepikScope } from "../../shared/components/stepik-scope"
import { hrefs } from "../../shared/utils/hrefs"
import { LinkButton } from "../../shared/components/link-button"

/** `/`: published public courses with a search box (UF-LMS-01). */
export function CatalogPage() {
  const t = useT("catalog")
  const [text, setText] = useState("")
  const query = useDebounce(text.trim(), 300)
  const courses = useQuery({
    ...getLmsCoursesQuery(query ? { query } : undefined),
    placeholderData: keepPreviousData,
  })

  return (
    <StepikScope>
      <PageContainer
        title={t("title")}
        description={t("description")}
        actions={
          <LinkButton href={hrefs.join()} variant="outline" className="min-h-11 md:min-h-8">
            <Icons.links aria-hidden />
            {t("enterCode")}
          </LinkButton>
        }
      >
        <div className="relative max-w-xl">
          <Icons.search
            className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="h-11 ps-9"
          />
        </div>
        <QueryState
          query={courses}
          isEmpty={(items) => items.length === 0}
          emptyText={query ? t("emptySearch") : t("empty")}
        >
          {(items) => (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {items.map((course) => (
                <li key={course.id} className="flex">
                  <CourseCardView course={course} className="w-full" />
                </li>
              ))}
            </ul>
          )}
        </QueryState>
      </PageContainer>
    </StepikScope>
  )
}

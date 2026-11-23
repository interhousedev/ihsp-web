"use client"

import { useT } from "@ihsp/i18n"
import { useSession } from "@ihsp/auth"
import { PageLoading } from "@ihsp/features-core"
import { StateView } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { LandingAbout, LandingAuthors, LandingSyllabus } from "../../landing/components/landing-page"
import { LearnerFrame } from "../../player/components/learner-frame"
import { LearnerSidebar } from "../../player/components/learner-sidebar"
import { PreviewBanner } from "../../player/components/preview-banner"
import type { SidebarLink } from "../../player/components/sidebar-footer"
import { useStepOutline } from "../../player/hooks/use-step-outline"
import { StaffList } from "../../shared/components/staff-list"
import { reads } from "../../shared/hooks/use-guest"
import { courseProgress } from "../../shared/utils/course-progress"
import { hrefs } from "../../shared/utils/hrefs"
import { CourseOutline } from "./course-outline"
import { CoursePartnersSection } from "../../certificates/components/course-partners-section"

/**
 * `/course/<id>/info/`: the course description, syllabus and staff as a page of the lesson player. The sidebar stays and
 * its first entry is active; nobody is redirected to a lesson from here. `preview` shows the draft's landing.
 */
export function CourseInfoPlayer({ courseId, preview }: { courseId: string; preview: boolean }) {
  const t = useT("player")
  const tc = useT("courseLanding")
  const tGuest = useT("guest")
  const tCourse = useT("course")
  const guest = useSession().status === "anonymous"
  const around = useStepOutline({ courseId, slug: null, preview })
  const landing = useQuery({ ...reads.landing(guest, around.slug ?? "", preview), enabled: around.slug !== null })
  const course = around.course
  const info = landing.data

  const stepHref = (id: string) => (preview ? hrefs.preview(courseId, id) : hrefs.step(courseId, id))
  const backHref = preview ? hrefs.edit(courseId) : guest ? hrefs.catalog() : hrefs.myCourses()
  const links: SidebarLink[] = preview
    ? [{ key: "editor", label: t("backToEditor"), href: hrefs.edit(courseId) }]
    : [
        ...(course?.can_edit ? [{ key: "edit", label: t("editCourse"), href: hrefs.edit(courseId) }] : []),
        guest
          ? { key: "catalog", label: tGuest("catalog"), href: hrefs.catalog() }
          : { key: "my", label: t("myCourses"), href: hrefs.myCourses() },
      ]

  const failed = around.unavailable && !course && !info
  const loading = !failed && !course && !info && !landing.isError && (landing.isPending || around.slug === null)

  return (
    <LearnerFrame
      strip={null}
      sidebar={
        <LearnerSidebar
          title={around.courseTitle}
          progress={courseProgress(course)}
          outline={around.outline}
          unavailable={around.unavailable}
          currentStepId=""
          infoHref={hrefs.courseInfo(courseId, preview)}
          infoActive
          hrefFor={stepHref}
          links={links}
        />
      }
    >
      {preview ? <PreviewBanner backHref={backHref} /> : null}
      <div className="flex min-w-0 flex-col gap-8 px-4 py-5 md:px-6">
        {failed ? (
          <StateView state="error" error={landing.error} onRetry={() => void landing.refetch()} />
        ) : loading ? (
          <PageLoading />
        ) : (
          <>
            <h1 className="text-2xl font-semibold break-words">
              {info?.friendly_name || info?.title || around.courseTitle}
            </h1>
            <section className="flex flex-col gap-3">
              {info ? (
                <LandingAbout landing={info} />
              ) : (
                <p className="text-sm leading-relaxed break-words whitespace-pre-line">{course?.description}</p>
              )}
            </section>
            <section aria-labelledby="info-syllabus" className="flex flex-col gap-3">
              <h2 id="info-syllabus" className="text-xl font-semibold">
                {tCourse("tabs.syllabus")}
              </h2>
              {course ? (
                <CourseOutline page={course} linkSteps={course.enrolled || course.can_edit || guest} />
              ) : info ? (
                <LandingSyllabus landing={info} />
              ) : null}
            </section>
            <section aria-labelledby="info-staff" className="flex flex-col gap-3">
              <h2 id="info-staff" className="text-xl font-semibold">
                {tCourse("tabs.staff")}
              </h2>
              {course ? <StaffList staff={course.staff} /> : info ? <LandingAuthors landing={info} /> : null}
            </section>
            <CoursePartnersSection courseId={courseId} />
          </>
        )}
      </div>
    </LearnerFrame>
  )
}

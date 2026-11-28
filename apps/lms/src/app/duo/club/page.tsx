"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { CourseClubPanel } from "@/features/duo-coach/course-club-panel"
import { LmsShell } from "@/features/shell/components/lms-shell"

function Panel() {
  const params = useSearchParams()
  const side = params.get("side")
  return (
    <CourseClubPanel
      mode={side === "club" ? "club" : "course"}
      courseId={params.get("course") ?? undefined}
      clubId={params.get("club") ?? undefined}
    />
  )
}

/** The course ↔ club link. Default is the "Course club" block (`?course=`); `?side=club&club=` is "Club courses". */
export default function Page() {
  return (
    <LmsShell access="auth">
      <div className="mx-auto w-full max-w-2xl p-4">
        <Suspense fallback={null}>
          <Panel />
        </Suspense>
      </div>
    </LmsShell>
  )
}

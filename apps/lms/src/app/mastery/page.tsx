"use client"

import { MasteryPage } from "@/features/engagement/components/mastery-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["course"]}>{({ course }) => <MasteryPage courseId={course} />}</ParamsRoute>
    </LmsShell>
  )
}

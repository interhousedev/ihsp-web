"use client"

import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"
import { AttemptReviewPage } from "@/features/students/components/attempt-review-page"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]} optional={["course"]}>
        {({ id, course }) => <AttemptReviewPage attemptId={id} courseId={course} />}
      </ParamsRoute>
    </LmsShell>
  )
}

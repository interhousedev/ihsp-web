"use client"

import { StepPlayer } from "@/features/player/components/step-player"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["course", "step"]} optional={["slug"]}>
        {({ course, step, slug }) => <StepPlayer key={step} courseId={course} stepId={step} slug={slug} mode="learn" />}
      </ParamsRoute>
    </LmsShell>
  )
}

"use client"

import { StepPlayer } from "@/features/player/components/step-player"
import { ParamsRoute, toPositiveInt } from "@/features/shared/components/params-route"
import { LearnerShell } from "@/features/shell/components/learner-shell"

export default function Page() {
  return (
    <LearnerShell>
      <ParamsRoute required={["course", "step"]} optional={["slug", "block"]}>
        {({ course, step, slug, block }) => (
          <StepPlayer
            key={step}
            courseId={course}
            stepId={step}
            slug={slug}
            block={toPositiveInt(block)}
            mode="learn"
          />
        )}
      </ParamsRoute>
    </LearnerShell>
  )
}

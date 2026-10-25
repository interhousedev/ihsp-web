"use client"

import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"
import { StepEditorPage } from "@/features/step-editor/components/step-editor-page"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <StepEditorPage stepId={id} />}</ParamsRoute>
    </LmsShell>
  )
}

"use client"

import { PreviewPage } from "@/features/preview/components/preview-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]} optional={["step"]}>
        {({ id, step }) => <PreviewPage key={step ?? "index"} courseId={id} stepId={step} />}
      </ParamsRoute>
    </LmsShell>
  )
}

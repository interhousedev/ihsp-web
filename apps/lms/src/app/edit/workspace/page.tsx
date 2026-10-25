"use client"

import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"
import { WorkspacePage } from "@/features/workspace/components/workspace-page"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <WorkspacePage courseId={id} />}</ParamsRoute>
    </LmsShell>
  )
}

"use client"

import { PublishPage } from "@/features/publish/components/publish-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <PublishPage courseId={id} />}</ParamsRoute>
    </LmsShell>
  )
}

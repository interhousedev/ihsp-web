"use client"

import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"
import { VersionsPage } from "@/features/versions/components/versions-page"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <VersionsPage courseId={id} />}</ParamsRoute>
    </LmsShell>
  )
}

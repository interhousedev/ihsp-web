"use client"

import { CourseSettingsPage } from "@/features/settings/components/settings-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <CourseSettingsPage courseId={id} />}</ParamsRoute>
    </LmsShell>
  )
}

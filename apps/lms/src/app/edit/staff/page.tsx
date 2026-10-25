"use client"

import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"
import { StaffPage } from "@/features/staff/components/staff-page"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <StaffPage courseId={id} />}</ParamsRoute>
    </LmsShell>
  )
}

"use client"

import { CertificatesPage } from "@/features/certificates/components/certificates-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["course"]}>{({ course }) => <CertificatesPage courseId={course} />}</ParamsRoute>
    </LmsShell>
  )
}

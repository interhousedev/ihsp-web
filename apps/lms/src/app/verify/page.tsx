"use client"

import { VerifyPage } from "@/features/certificates/components/verify-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell access="public">
      <ParamsRoute required={[]} optional={["code"]}>
        {({ code }) => <VerifyPage key={code ?? ""} code={code} />}
      </ParamsRoute>
    </LmsShell>
  )
}

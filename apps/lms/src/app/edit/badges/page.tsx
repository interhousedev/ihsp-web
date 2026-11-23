"use client"

import { BadgesPage } from "@/features/badges/components/badges-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id"]}>{({ id }) => <BadgesPage courseId={id} />}</ParamsRoute>
    </LmsShell>
  )
}

"use client"

import { MissingParam } from "@/features/shared/components/missing-param"
import { ParamsRoute, toPositiveInt } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"
import { VersionViewPage } from "@/features/versions/components/version-view-page"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id", "n"]}>
        {({ id, n }) => {
          const number = toPositiveInt(n)
          return number === null ? <MissingParam /> : <VersionViewPage courseId={id} number={number} />
        }}
      </ParamsRoute>
    </LmsShell>
  )
}

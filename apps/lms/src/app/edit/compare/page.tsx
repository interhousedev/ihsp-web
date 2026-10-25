"use client"

import { MissingParam } from "@/features/shared/components/missing-param"
import { ParamsRoute, toPositiveInt } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"
import { ComparePage } from "@/features/versions/components/compare-page"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["id", "a", "b"]}>
        {({ id, a, b }) => {
          const from = toPositiveInt(a)
          const to = toPositiveInt(b)
          return from === null || to === null ? <MissingParam /> : <ComparePage courseId={id} a={from} b={to} />
        }}
      </ParamsRoute>
    </LmsShell>
  )
}

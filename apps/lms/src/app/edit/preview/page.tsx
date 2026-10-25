"use client"

import { PreviewPage } from "@/features/preview/components/preview-page"
import { PreviewShell } from "@/features/preview/components/preview-shell"
import { ParamsRoute, toPositiveInt } from "@/features/shared/components/params-route"
import { PageLoading } from "@/features/shell/components/page-loading"
import { Suspense } from "react"

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PreviewShell>
        <ParamsRoute required={["id"]} optional={["step", "block"]}>
          {({ id, step, block }) => (
            <PreviewPage key={step ?? "index"} courseId={id} stepId={step} block={toPositiveInt(block)} />
          )}
        </ParamsRoute>
      </PreviewShell>
    </Suspense>
  )
}

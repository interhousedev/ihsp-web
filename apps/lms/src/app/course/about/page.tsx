"use client"

import { LandingPage } from "@/features/landing/components/landing-page"
import { ParamsRoute } from "@/features/shared/components/params-route"
import { LmsShell } from "@/features/shell/components/lms-shell"

export default function Page() {
  return (
    <LmsShell>
      <ParamsRoute required={["slug"]} optional={["preview"]}>
        {({ slug, preview }) => <LandingPage slug={slug} preview={preview === "1"} />}
      </ParamsRoute>
    </LmsShell>
  )
}

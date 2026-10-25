"use client"

import { useT } from "@ihsp/i18n"
import { PageContainer } from "@ihsp/ui"
import { useState } from "react"
import { UploadWizard } from "./upload-wizard"

/** `/upload/`: add a material (teachers and students). Needs a signed-in user; the page wraps it in `auth`. */
export function UploadPage() {
  const t = useT("library.upload")
  const [round, setRound] = useState(0)
  return (
    <PageContainer title={t("title")}>
      <UploadWizard key={round} onAnother={() => setRound((current) => current + 1)} />
    </PageContainer>
  )
}

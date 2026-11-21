"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useT } from "@ihsp/i18n"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { AlgorithmFlow } from "./algorithm-flow"

/** `/colleges/algorithm`: the college-search questionnaire on a page of its own. */
export function AlgorithmPage() {
  const t = useT("prefs")
  return (
    <AdmissionShell>
      <div className={pageClass()}>
        <AppPageHeader icon="discover" title={t("title")} />
        <AlgorithmFlow />
      </div>
    </AdmissionShell>
  )
}

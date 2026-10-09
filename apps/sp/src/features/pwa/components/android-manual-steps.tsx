"use client"

import { useT } from "@ihsp/i18n"
import { IconCheck, IconDeviceMobileDown, IconDotsVertical } from "@tabler/icons-react"
import { StepList } from "./step-list"

/** Android browsers that did not offer the install dialog (Firefox, Samsung Internet, or a dialog that was dismissed). */
export function AndroidManualSteps() {
  const t = useT("pwa")
  return (
    <section className="flex flex-col gap-3" aria-labelledby="pwa-platform-title">
      <h2 id="pwa-platform-title" className="text-base font-semibold">
        {t("android.manual.title")}
      </h2>
      <StepList
        steps={[
          { icon: IconDotsVertical, text: t("android.manual.step1") },
          { icon: IconDeviceMobileDown, text: t("android.manual.step2") },
          { icon: IconCheck, text: t("android.manual.step3") },
        ]}
      />
    </section>
  )
}

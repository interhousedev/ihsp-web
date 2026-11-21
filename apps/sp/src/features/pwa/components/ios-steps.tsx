"use client"

import { useT } from "@ihsp/i18n"
import { IconSquarePlus, IconShare2, IconCheck } from "@ihsp/ui"
import { StepList } from "./step-list"

/** Safari on iPhone and iPad has no install button: Share → Add to Home Screen. */
export function IosSteps({ openInSafari }: { openInSafari: boolean }) {
  const t = useT("pwa")
  return (
    <section className="flex flex-col gap-3" aria-labelledby="pwa-platform-title">
      <h2 id="pwa-platform-title" className="text-base font-semibold">
        {t("ios.title")}
      </h2>
      {openInSafari ? (
        <p role="note" className="bg-muted text-muted-foreground rounded-lg p-3 text-sm">
          {t("ios.openInSafari")}
        </p>
      ) : null}
      <p className="text-muted-foreground text-sm">{t("ios.pushNote")}</p>
      <StepList
        steps={[
          { icon: IconShare2, text: t("ios.step1") },
          { icon: IconSquarePlus, text: t("ios.step2") },
          { icon: IconCheck, text: t("ios.step3") },
        ]}
      />
    </section>
  )
}

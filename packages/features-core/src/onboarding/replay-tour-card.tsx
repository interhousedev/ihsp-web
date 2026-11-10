"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { replayOnboardingTour } from "./use-onboarding-tour"

/** The Settings block that opens the first-run tour again. */
export function ReplayTourButton() {
  const t = useT("onboarding.replay")
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-muted-foreground text-sm">{t("description")}</p>
      <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={replayOnboardingTour}>
        {t("button")}
      </Button>
    </div>
  )
}

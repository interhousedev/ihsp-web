"use client"

import { useSession } from "@ihsp/auth"
import { usePreferences } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import { Button, ResponsiveDialog } from "@ihsp/ui"
import { usePathname } from "next/navigation"
import { useRef, useState } from "react"
import { chooserPostponed, postponeChooser, SKINS } from "./skin"
import { SkinPreview } from "./skin-preview"
import { useSkin } from "./skin-provider"

/** Learner pages where the skin matters; staff and editor routes (/edit, /admin, /media) never show the chooser. */
const LEARNER_PREFIXES = ["/my", "/course", "/mastery", "/review", "/notebooks", "/profile"]

function isLearnerPath(pathname: string): boolean {
  return pathname === "/" || LEARNER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * First-visit chooser: two live previews, nothing pre-selected (focus lands on the title, not a card). Shown on learner
 * pages to a signed-in user whose account and device have no skin yet, unless "Decide later" postponed it.
 */
export function SkinChooser() {
  const t = useT("skin")
  const { skin, setSkin } = useSkin()
  const { status } = useSession()
  const preferences = usePreferences()
  const [dismissed, setDismissed] = useState(false)
  const pathname = usePathname()
  const titleRef = useRef<HTMLSpanElement>(null)
  const open =
    !dismissed &&
    isLearnerPath(pathname) &&
    status === "authenticated" &&
    preferences !== null &&
    preferences.lms_skin === null &&
    skin === null &&
    !chooserPostponed()

  const later = () => {
    postponeChooser()
    setDismissed(true)
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) later()
      }}
      title={
        <span ref={titleRef} tabIndex={-1} className="outline-none">
          {t("chooser.title")}
        </span>
      }
      initialFocus={titleRef}
      description={t("chooser.description")}
      size="lg"
      footer={
        <Button variant="ghost" onClick={later} data-testid="skin-later">
          {t("chooser.later")}
        </Button>
      }
    >
      <div role="group" aria-label={t("chooser.title")} className="grid gap-3 sm:grid-cols-2">
        {SKINS.map((option) => (
          <button
            key={option}
            type="button"
            data-testid={`skin-pick-${option}`}
            onClick={() => setSkin(option)}
            className="hover:border-primary focus-visible:ring-ring/50 rounded-card flex min-h-11 flex-col gap-2 border-2 p-3 text-left outline-none focus-visible:ring-3"
          >
            <SkinPreview skin={option} />
            <span className="font-semibold">{t(`name.${option}`)}</span>
            <span className="text-muted-foreground text-sm">{t(`hint.${option}`)}</span>
          </button>
        ))}
      </div>
    </ResponsiveDialog>
  )
}

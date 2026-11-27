"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { StudentCardSheet } from "./student-card-sheet"

/** Opens the student card (the QR code of the student's pass). `iconOnly` is the round QR button of Home's compact bar; `onHero` restyles the outline button for the brand-gradient hero. */
export function StudentCardButton({ iconOnly = false, onHero = false }: { iconOnly?: boolean; onHero?: boolean }) {
  const t = useT("home")
  const [open, setOpen] = useState(false)
  return (
    <>
      {iconOnly ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("studentCard")}
          className="size-11 rounded-full"
          onClick={() => setOpen(true)}
        >
          <Icons.qrCode className="size-5" aria-hidden />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          className={
            onHero
              ? "border-white/60 bg-white/15 text-(--brand-ink) hover:bg-white/25 hover:text-(--brand-ink)"
              : undefined
          }
          onClick={() => setOpen(true)}
        >
          <Icons.qrCode className="size-4" aria-hidden />
          {t("studentCard")}
        </Button>
      )}
      <StudentCardSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

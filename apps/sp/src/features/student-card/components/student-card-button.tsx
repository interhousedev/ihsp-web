"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { StudentCardSheet } from "./student-card-sheet"

/** Opens the student card (the QR code of the student's pass) from the Profile page. */
export function StudentCardButton() {
  const t = useT("home")
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Icons.qrCode className="size-4" aria-hidden />
        {t("studentCard")}
      </Button>
      <StudentCardSheet open={open} onOpenChange={setOpen} />
    </>
  )
}

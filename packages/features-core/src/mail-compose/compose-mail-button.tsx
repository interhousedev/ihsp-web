"use client"

import { useT } from "@ihsp/i18n"
import { Button, Icons } from "@ihsp/ui"
import { useState } from "react"
import { ComposeMailDialog } from "./compose-mail-dialog"

/** Header action "Написать письмо": an icon button that opens the compose dialog. `to` starts the recipients list. */
export function ComposeMailButton({ to = [] }: { to?: readonly string[] }) {
  const t = useT("composeMail")
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" size="icon" className="size-11 md:size-8" aria-label={t("open")} onClick={() => setOpen(true)}>
        <Icons.mail aria-hidden />
      </Button>
      {open ? <ComposeMailDialog open={open} onOpenChange={setOpen} initialTo={to} /> : null}
    </>
  )
}

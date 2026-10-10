"use client"

import { useT } from "@ihsp/i18n"
import { IconButton, Icons } from "@ihsp/ui"
import { useState } from "react"
import { ComposeMailDialog } from "./compose-mail-dialog"

/** Header action "Написать письмо": an icon button that opens the compose dialog. `to` starts the recipients list. */
export function ComposeMailButton({ to = [] }: { to?: readonly string[] }) {
  const t = useT("composeMail")
  const [open, setOpen] = useState(false)
  return (
    <>
      <IconButton icon={Icons.mail} aria-label={t("open")} onClick={() => setOpen(true)} />
      {open ? <ComposeMailDialog open={open} onOpenChange={setOpen} initialTo={to} /> : null}
    </>
  )
}

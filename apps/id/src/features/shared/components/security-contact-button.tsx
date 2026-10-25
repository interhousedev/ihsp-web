"use client"

import { readConfig } from "@ihsp/config"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { useTr } from "../hooks/use-tr"
import { parseSecurityContact } from "../utils/security-contact"

/**
 * "Security contact" button of the auth layout. It opens a dialog with the contact from the runtime config as plain
 * text, with the email and the Telegram handle linked. Read after mount, so the static HTML never depends on env.js;
 * the button is not rendered when the contact is unset or empty.
 */
export function SecurityContactButton() {
  const t = useTr()
  const [contact, setContact] = useState<string | undefined>(undefined)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const result = readConfig()
    setContact(result.ok ? result.config.SECURITY_CONTACT : undefined)
  }, [])

  if (!contact) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="link" className="min-h-11" />}>
        {t("idCommon.securityContact.button")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("idCommon.securityContact.title")}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{t("idCommon.securityContact.hint")}</p>
        <p className="text-base font-medium break-words">
          {parseSecurityContact(contact).map((part, index) =>
            part.kind === "text" ? (
              <span key={index}>{part.text}</span>
            ) : (
              <a key={index} href={part.href} className="text-primary underline underline-offset-4">
                {part.text}
              </a>
            ),
          )}
        </p>
      </DialogContent>
    </Dialog>
  )
}

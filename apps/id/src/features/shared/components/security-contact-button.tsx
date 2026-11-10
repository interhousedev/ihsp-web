"use client"

import { readConfig } from "@ihsp/config"
import { Button, ResponsiveDialog } from "@ihsp/ui"
import { useEffect, useState } from "react"
import { useTr } from "@ihsp/features-core/id-account"
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
    <>
      <Button variant="link" className="min-h-11" onClick={() => setOpen(true)}>
        {t("idCommon.securityContact.button")}
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen} title={t("idCommon.securityContact.title")} size="sm">
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
      </ResponsiveDialog>
    </>
  )
}

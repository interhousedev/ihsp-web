"use client"

import { useT } from "@ihsp/i18n"
import { IconCheck, IconNotebook } from "@ihsp/ui"
import Link from "next/link"

/** Where the material will be stored: every material goes to the subject notebook, there is no switch. */
export function NotebookHint({ destination }: { destination: string }) {
  const t = useT("aiTools")
  return (
    <p className="text-muted-foreground flex items-start gap-2 text-sm">
      <IconNotebook className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{t("saveHint", { name: destination })}</span>
    </p>
  )
}

/** Where the finished material was stored, with a link to the notebook. */
export function NotebookSaved({ destination }: { destination: string }) {
  const t = useT("aiTools")
  return (
    <p className="text-success flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
      <IconCheck className="size-4 shrink-0" aria-hidden />
      <span>{t("savedTo", { name: destination })}</span>
      <Link href="/notebooks/" className="text-primary underline-offset-2 hover:underline">
        {t("openNotebook")}
      </Link>
    </p>
  )
}

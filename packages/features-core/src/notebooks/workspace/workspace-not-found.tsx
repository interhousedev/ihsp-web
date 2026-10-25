"use client"

import { useT } from "@ihsp/i18n"
import { buttonVariants, StateView } from "@ihsp/ui"
import Link from "next/link"

/** The notebook does not exist (or is not the user's): a note and a link back (to the list by default). */
export function WorkspaceNotFound({ backHref = "/notebooks/" }: { backHref?: string }) {
  const t = useT("notebooks")
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center p-4">
      <StateView
        state="empty"
        emptyText={t("workspace.notFound")}
        action={
          <Link href={backHref} className={buttonVariants({ variant: "default", className: "min-h-11" })}>
            {t("workspace.back")}
          </Link>
        }
      />
    </div>
  )
}

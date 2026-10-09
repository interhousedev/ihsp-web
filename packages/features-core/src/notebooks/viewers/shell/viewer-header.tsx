"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { IconArrowLeft } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { useWorkspace } from "../../workspace-context"
import { useFocusHeading } from "./use-focus-heading"

type ViewerHeaderProps = {
  titleId: string
  title: string
  /** The ⋮ menu (absent while the item is loading). */
  menu?: ReactNode
}

/** Back to the chat, the title (focused when the viewer opens) and the item menu of every artifact viewer. */
export function ViewerHeader({ titleId, title, menu }: ViewerHeaderProps) {
  const t = useT("notebooks")
  const { closeViewer } = useWorkspace()
  const headingRef = useFocusHeading()

  return (
    <header className="bg-background flex shrink-0 items-center gap-1 border-b px-2 py-1.5 print:hidden md:px-3">
      <Button type="button" variant="ghost" className="min-h-11 shrink-0 gap-1.5 px-2" onClick={closeViewer}>
        <IconArrowLeft aria-hidden className="size-4 rtl:rotate-180" />
        {t("viewer.back")}
      </Button>
      <h2
        id={titleId}
        ref={headingRef}
        tabIndex={-1}
        className="min-w-0 flex-1 truncate px-2 text-base font-semibold outline-hidden focus-visible:underline"
      >
        {title}
      </h2>
      {menu}
    </header>
  )
}

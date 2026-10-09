"use client"

import type { NotebookDetail } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { IconBooks, IconWand } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { useArtifacts } from "../api"
import type { SidePane } from "./use-pane-state"

type SheetButtonProps = {
  label: string
  icon: ReactNode
  count: number
  onClick: () => void
}

function SheetButton({ label, icon, count, onClick }: SheetButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="hover:bg-muted focus-visible:ring-ring relative inline-flex size-11 shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 md:size-9 [&>svg]:size-5"
      onClick={onClick}
    >
      {icon}
      {count > 0 ? (
        <span
          aria-hidden
          className="bg-primary text-primary-foreground absolute end-0.5 top-0.5 min-w-4 rounded-full px-1 text-center text-[10px] leading-4 tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  )
}

type PaneSheetButtonsProps = {
  notebook: NotebookDetail
  onOpen: (pane: SidePane) => void
}

/** Tablet header: two buttons (with counts) that open the Sources and the Studio sheets. */
export function PaneSheetButtons({ notebook, onOpen }: PaneSheetButtonsProps) {
  const t = useT("notebooks.workspace")
  const artifacts = useArtifacts(notebook.id)
  return (
    <>
      <SheetButton
        label={t("openSources", { count: notebook.source_count })}
        icon={<IconBooks aria-hidden />}
        count={notebook.source_count}
        onClick={() => onOpen("sources")}
      />
      <SheetButton
        label={t("openStudio", { count: artifacts.data?.length ?? 0 })}
        icon={<IconWand aria-hidden />}
        count={artifacts.data?.length ?? 0}
        onClick={() => onOpen("studio")}
      />
    </>
  )
}

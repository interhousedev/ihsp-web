"use client"

import type { Citation } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  useIsMobile,
} from "@ihsp/ui"
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { SourceKindIcon } from "../lib/source-icons"
import { useWorkspace } from "../workspace-context"

type CitationNavigation = { open: (citation: Citation) => void }

const CitationNavigationContext = createContext<CitationNavigation | null>(null)

/**
 * Where a click on a citation chip goes. On a desktop it opens the source viewer at the passage; on a phone it opens
 * a bottom sheet with the quote and "Open in source" (docs/reference/notebooklm.md § 5.4.1). The workspace wraps its
 * panes in `CitationNavigationProvider`; outside of one the chip opens the source viewer directly.
 */
export function useCitationNavigation(): CitationNavigation {
  const provided = useContext(CitationNavigationContext)
  const workspace = useWorkspace()
  return useMemo(
    () => provided ?? { open: (citation) => workspace.openSource(citation.source_id, citation.passage_id) },
    [provided, workspace],
  )
}

export function CitationNavigationProvider({ children }: { children: ReactNode }) {
  const workspace = useWorkspace()
  const isMobile = useIsMobile()
  const [active, setActive] = useState<Citation | null>(null)

  const open = useCallback(
    (citation: Citation) => {
      if (isMobile) setActive(citation)
      else workspace.openSource(citation.source_id, citation.passage_id)
    },
    [isMobile, workspace],
  )
  const value = useMemo(() => ({ open }), [open])

  return (
    <CitationNavigationContext.Provider value={value}>
      {children}
      <CitationSheet
        citation={active}
        onClose={() => setActive(null)}
        onOpenSource={(citation) => {
          setActive(null)
          workspace.openSource(citation.source_id, citation.passage_id)
        }}
      />
    </CitationNavigationContext.Provider>
  )
}

type CitationSheetProps = {
  citation: Citation | null
  onClose: () => void
  onOpenSource: (citation: Citation) => void
}

/** Bottom sheet of a phone: the quote behind a citation and a button that opens the source at the passage. */
function CitationSheet({ citation, onClose, onOpenSource }: CitationSheetProps) {
  const t = useT("notebooks")
  return (
    <Drawer open={citation !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {citation ? (
          <>
            <DrawerHeader className="text-start">
              <DrawerTitle className="flex items-center gap-2 text-base">
                <SourceKindIcon kind={citation.source_kind} title={citation.source_title} className="size-5" />
                <span className="min-w-0 truncate">{citation.source_title}</span>
              </DrawerTitle>
              <DrawerDescription>
                {t("citation.label", { n: citation.n })}
                {citation.page !== null ? ` · ${t("viewer.page", { page: citation.page })}` : ""}
              </DrawerDescription>
            </DrawerHeader>
            <blockquote className="border-primary/50 mx-4 border-s-4 ps-3 text-sm break-words">
              {citation.snippet}
            </blockquote>
            <DrawerFooter>
              <Button type="button" className="min-h-11" onClick={() => onOpenSource(citation)}>
                {t("citation.open")}
              </Button>
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}

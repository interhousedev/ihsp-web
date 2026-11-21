"use client"

import { useT } from "@ihsp/i18n"
import { ResponsiveDialog } from "@ihsp/ui"
import { UniChatPanel } from "../../discover/components/uni-chat-panel"
import type { ListRow } from "../use-list-rows"

/** The AI research of one university, opened from a row whose facts are missing: the per-university chat panel. */
export function ResearchDialog({ row, onClose }: { row: ListRow | null; onClose: () => void }) {
  const t = useT("uniList")
  const institution = row?.entry.institution
  return (
    <ResponsiveDialog
      open={row !== null}
      onOpenChange={(open) => !open && onClose()}
      title={t("researchTitle", { name: institution?.name ?? "" })}
      description={row ? t("researchMissing", { facts: row.missing.map((key) => t(`missing.${key}`)).join(", ") }) : undefined}
      size="lg"
    >
      {institution ? (
        <UniChatPanel
          match={{
            university_id: institution.id,
            name: institution.name,
            logo_url: institution.logo_url,
            city: institution.city ?? "",
          }}
        />
      ) : null}
    </ResponsiveDialog>
  )
}

"use client"

import type { SourceItem } from "@ihsp/api"
import { labelEmoji } from "../lib/label-emoji"
import { useT } from "@ihsp/i18n"
import { ConfirmDialog } from "@ihsp/ui"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"
import { useDeleteLabel, useRenameLabel } from "../api"
import type { TopicGroupData } from "../lib/topic-groups"
import { LabelMenu } from "./label-menu"
import { LabelRenameField } from "./label-rename-field"
import { SourceGroup } from "./source-group"

type TopicGroupProps = {
  notebookId: string
  group: TopicGroupData
  /** Course staff who may only read cannot rename or delete labels. */
  readOnly: boolean
  onToggleGroup: (sources: readonly SourceItem[], selected: boolean) => void
  renderRow: (source: SourceItem) => ReactNode
}

/** One topic of the Sources panel: the usual group (count, group checkbox) under the label's emoji and name. */
export function TopicGroup({ notebookId, group, readOnly, onToggleGroup, renderRow }: TopicGroupProps) {
  const t = useT("notebooks")
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const rename = useRenameLabel(notebookId)
  const remove = useDeleteLabel(notebookId)
  const { label, sources } = group
  const name = label ? `${labelEmoji(label)} ${label.name}` : t("label.other")

  function confirmDelete() {
    if (!label) return
    remove.mutate(label.id, {
      onSuccess: () => setConfirming(false),
      onError: () => {
        setConfirming(false)
        toast.error(t("label.deleteFailed"))
      },
    })
  }

  function save(next: string) {
    setEditing(false)
    if (label) rename.mutate({ id: label.id, name: next }, { onError: () => toast.error(t("label.renameFailed")) })
  }

  return (
    <>
      <SourceGroup
        name={name}
        sources={sources}
        onToggleGroup={onToggleGroup}
        renaming={
          editing && label ? (
            <LabelRenameField name={label.name} onSave={save} onCancel={() => setEditing(false)} />
          ) : null
        }
        menu={
          label && !readOnly ? (
            <LabelMenu name={name} onRename={() => setEditing(true)} onDelete={() => setConfirming(true)} />
          ) : null
        }
      >
        {sources.map(renderRow)}
      </SourceGroup>
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => !open && !remove.isPending && setConfirming(false)}
        title={t("label.deleteTitle")}
        description={t("label.deleteDescription")}
        confirmLabel={t("label.delete")}
        destructive
        loading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

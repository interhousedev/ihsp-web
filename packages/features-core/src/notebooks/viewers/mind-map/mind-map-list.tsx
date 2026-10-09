"use client"

import type { RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import type { TreeNode } from "../../lib/tree"
import { MindMapListItem } from "./mind-map-list-item"

type MindMapListProps = {
  tree: TreeNode
  title: string
  collapsed: ReadonlySet<string>
  refsIndex: RefsIndex
  onToggle: (id: string) => void
}

/**
 * The outline view: the whole map as nested lists with disclosure buttons. It is the accessible alternative to the
 * canvas and shares the expanded state with it.
 */
export function MindMapList({ tree, title, collapsed, refsIndex, onToggle }: MindMapListProps) {
  const t = useT("notebooks")
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-6 md:px-4" data-slot="mind-map-outline">
      <ul aria-label={t("mindmap.outline", { title })} className="mx-auto flex max-w-3xl flex-col">
        <MindMapListItem item={tree} collapsed={collapsed} refsIndex={refsIndex} onToggle={onToggle} />
      </ul>
    </div>
  )
}

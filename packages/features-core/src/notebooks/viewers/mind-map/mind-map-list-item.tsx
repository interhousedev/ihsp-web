"use client"

import type { RefsIndex } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, cn } from "@ihsp/ui"
import { IconChevronRight } from "@tabler/icons-react"
import { useId } from "react"
import { RefChips } from "../../chat/ref-chips"
import type { TreeNode } from "../../lib/tree"
import { branchColor } from "./branch-colors"
import { MindMapNodeActions } from "./mind-map-node-actions"

type MindMapListItemProps = {
  item: TreeNode
  collapsed: ReadonlySet<string>
  refsIndex: RefsIndex
  onToggle: (id: string) => void
}

/** One row of the outline: a disclosure button, the label, the note, the source chips and the node actions. */
export function MindMapListItem({ item, collapsed, refsIndex, onToggle }: MindMapListItemProps) {
  const t = useT("notebooks")
  const groupId = useId()
  const { node } = item
  const hasChildren = item.children.length > 0
  const open = hasChildren && !collapsed.has(node.id)

  return (
    <li data-node-id={node.id}>
      <div className="flex items-start gap-1 py-1">
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-11 shrink-0 md:size-8"
            aria-expanded={open}
            aria-controls={open ? groupId : undefined}
            aria-label={`${open ? t("mindmap.collapse") : t("mindmap.expand")}: ${node.label}`}
            onClick={() => onToggle(node.id)}
          >
            <IconChevronRight
              aria-hidden
              className={cn("transition-transform motion-reduce:transition-none", open && "rotate-90")}
            />
          </Button>
        ) : (
          <span className="size-11 shrink-0 md:size-8" aria-hidden="true" />
        )}
        <div
          className="flex min-w-0 flex-1 flex-col gap-1 border-s-4 ps-3"
          style={{ borderColor: branchColor(item.branch) }}
        >
          <p className={cn("text-sm break-words", item.depth === 0 ? "font-semibold" : "font-medium")}>{node.label}</p>
          {node.note ? <p className="text-muted-foreground text-sm break-words">{node.note}</p> : null}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <MindMapNodeActions node={node} refsIndex={refsIndex} size="sm" />
            <RefChips refs={node.refs} refsIndex={refsIndex} />
          </div>
        </div>
      </div>
      {open ? (
        <ul id={groupId} className="ms-4 flex flex-col md:ms-6">
          {item.children.map((child) => (
            <MindMapListItem
              key={child.node.id}
              item={child}
              collapsed={collapsed}
              refsIndex={refsIndex}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

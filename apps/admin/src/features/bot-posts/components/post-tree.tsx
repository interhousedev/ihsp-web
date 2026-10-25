"use client"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { BotPostTreeNode } from "@ihsp/api"
import { useLocale, useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { flattenTree, siblingIds } from "../utils/tree"
import { postLabel } from "../utils/locales"

type TreeProps = {
  root: BotPostTreeNode
  selectedId: string | null
  onSelect: (id: string) => void
  /** New order of the children of `parentId` (all of them, in order). */
  onReorder: (parentId: string, ids: string[]) => void
}

/** The posts as a tree. Siblings are reordered by dragging (mouse or keyboard); moving to another parent is in the editor. */
export function PostTree({ root, selectedId, onSelect, onReorder }: TreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const moved = flattenTree(root).find((post) => post.id === active.id)
    const target = flattenTree(root).find((post) => post.id === over.id)
    if (!moved || !target || moved.is_root || moved.parent_id !== target.parent_id || !moved.parent_id) return
    const current = siblingIds(root, moved.parent_id)
    onReorder(moved.parent_id, arrayMove(current, current.indexOf(moved.id), current.indexOf(target.id)))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <TreeLevel nodes={[root]} depth={0} selectedId={selectedId} onSelect={onSelect} />
    </DndContext>
  )
}

function TreeLevel({
  nodes,
  depth,
  selectedId,
  onSelect,
}: {
  nodes: BotPostTreeNode[]
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <SortableContext items={nodes.map((node) => node.id)} strategy={verticalListSortingStrategy}>
      <ul className="flex flex-col gap-1">
        {nodes.map((node) => (
          <li key={node.id}>
            <TreeRow node={node} depth={depth} selectedId={selectedId} onSelect={onSelect} />
            {node.children.length > 0 ? (
              <TreeLevel nodes={node.children} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
            ) : null}
          </li>
        ))}
      </ul>
    </SortableContext>
  )
}

function TreeRow({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: BotPostTreeNode
  depth: number
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const t = useT("botPosts.tree")
  const locale = useLocale()
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: node.is_root,
  })
  const selected = node.id === selectedId
  const style = { transform: CSS.Transform.toString(transform), transition, paddingInlineStart: depth * 16 }

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-1 ${isDragging ? "opacity-60" : ""}`}>
      {node.is_root ? (
        <span className="w-8 shrink-0" aria-hidden />
      ) : (
        <Button
          ref={setActivatorNodeRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 cursor-grab"
          aria-label={t("dragHandle", { title: postLabel(node, locale) })}
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </Button>
      )}
      <Button
        type="button"
        variant={selected ? "secondary" : "ghost"}
        className="min-h-11 flex-1 justify-start truncate"
        aria-current={selected ? "true" : undefined}
        onClick={() => onSelect(node.id)}
      >
        <span className="truncate">{postLabel(node, locale)}</span>
        {node.published ? null : <span className="text-muted-foreground ms-2 text-xs">{t("draft")}</span>}
      </Button>
    </div>
  )
}

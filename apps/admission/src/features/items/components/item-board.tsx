"use client"

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Pill } from "@ihsp/ui"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { ScrollFade } from "@/components/scroll-fade"
import { incompleteFields, useMoveItem, useReorderItems, type Item, type ItemKind, type ItemStatus } from "../api"
import { ItemCard } from "./item-card"
import { missingFields, toForm } from "./item-fields"
import { ITEM_HEADING } from "./item-ui"

const STATUSES: ItemStatus[] = ["draft", "ready"]
const TONE = { draft: "warning", ready: "success" } as const
const COLUMN = "column:"
const CARD = "item:"
const STEP = 48

/** Left and right jump to the other column, up and down step through the cards. */
const coordinateGetter: KeyboardCoordinateGetter = (event, { context: { droppableRects }, currentCoordinates }) => {
  const target = event.code === "ArrowRight" ? "ready" : event.code === "ArrowLeft" ? "draft" : null
  if (target) {
    event.preventDefault()
    const rect = droppableRects.get(`${COLUMN}${target}`)
    return rect ? { x: rect.left + 8, y: rect.top + 8 } : undefined
  }
  if (event.code === "ArrowDown" || event.code === "ArrowUp") {
    event.preventDefault()
    return { x: currentCoordinates.x, y: currentCoordinates.y + (event.code === "ArrowDown" ? STEP : -STEP) }
  }
  return undefined
}

/** The whole card is the drag handle; it is also a drop target so a card can be placed before another. */
function DraggableCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Item
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}) {
  const drag = useDraggable({ id: item.id })
  const drop = useDroppable({ id: `${CARD}${item.id}` })
  return (
    <li
      ref={(node) => {
        drag.setNodeRef(node)
        drop.setNodeRef(node)
      }}
      {...drag.listeners}
      {...drag.attributes}
      role="group"
      aria-label={item.title}
      data-item-id={item.id}
      className={`focus-visible:ring-primary/60 flex cursor-grab rounded-card outline-none focus-visible:ring-2 active:cursor-grabbing ${
        drag.isDragging ? "opacity-40" : ""
      } ${drop.isOver && !drag.isDragging ? "ring-primary/40 ring-2" : ""}`}
    >
      <ItemCard item={item} onEdit={onEdit} onDelete={onDelete} />
    </li>
  )
}

function Column({
  status,
  items,
  onEdit,
  onDelete,
}: {
  status: ItemStatus
  items: Item[]
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}) {
  const t = useT("items")
  const drop = useDroppable({ id: `${COLUMN}${status}` })
  return (
    <section
      ref={drop.setNodeRef}
      aria-label={t(`column.${status}`)}
      className={`rounded-card flex min-w-0 flex-col gap-2 transition-shadow ${
        drop.isOver ? "ring-primary/40 ring-2 ring-offset-4" : ""
      }`}
    >
      <h2 className={ITEM_HEADING}>
        {t(`column.${status}`)}
        <Pill tone={TONE[status]} className="h-5 px-2 text-xs">
          {items.length}
        </Pill>
      </h2>
      {items.length === 0 ? (
        <p className="text-muted-foreground border-hairline rounded-card border border-dashed p-3 text-sm">
          {t(`column.empty.${status}`)}
        </p>
      ) : (
        <ScrollFade>
          <ul className="flex flex-col gap-2 p-1">
            {items.map((item) => (
              <DraggableCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </ul>
        </ScrollFade>
      )}
    </section>
  )
}

/**
 * Two columns, draft and ready. A card is dragged anywhere on its body (mouse, touch after a short hold,
 * or keyboard: Space, arrows, Space); dropping it on the other column changes its status, dropping it on a
 * card of the same column reorders.
 */
export function ItemBoard({
  drafts,
  ready,
  onEdit,
  onDelete,
}: {
  drafts: Item[]
  ready: Item[]
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}) {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const move = useMoveItem()
  const reorder = useReorderItems()
  const [active, setActive] = useState<Item | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const all = [...drafts, ...ready]
  const seen = useRef<Set<string> | null>(null)
  useEffect(() => {
    const ids = new Set(all.map((i) => i.id))
    const fresh = seen.current ? all.find((i) => !seen.current?.has(i.id)) : undefined
    seen.current = ids
    if (fresh) {
      document.querySelector(`[data-item-id="${fresh.id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  })
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter }),
  )

  const titleOf = (id: string | number) => all.find((i) => i.id === id)?.title ?? ""
  const columnOf = (id: string | number) => {
    const key = String(id)
    const status = key.startsWith(COLUMN) ? key.slice(COLUMN.length) : all.find((i) => `${CARD}${i.id}` === key)?.status
    return status ? t(`column.${status}`) : ""
  }
  const announcements: Announcements = {
    onDragStart: ({ active: a }) => t("board.pickup", { title: titleOf(a.id) }),
    onDragOver: ({ active: a, over }) =>
      over ? t("board.over", { title: titleOf(a.id), column: columnOf(over.id) }) : undefined,
    onDragEnd: ({ active: a, over }) =>
      over
        ? t("board.drop", { title: titleOf(a.id), column: columnOf(over.id) })
        : t("board.cancel", { title: titleOf(a.id) }),
    onDragCancel: ({ active: a }) => t("board.cancel", { title: titleOf(a.id) }),
  }

  function end(event: DragEndEvent) {
    setActive(null)
    const item = all.find((i) => i.id === event.active.id)
    if (!item || !event.over) return
    const overId = String(event.over.id)
    const overItem = overId.startsWith(CARD) ? all.find((i) => i.id === overId.slice(CARD.length)) : undefined
    const status = overItem ? overItem.status : overId.slice(COLUMN.length)
    if (status !== "draft" && status !== "ready") return
    setNotice(null)
    if (status !== item.status) {
      move.mutate(
        { item, status },
        {
          onSuccess: () => {
            const missing = status === "ready" ? missingFields(toForm(item), item.kind as ItemKind) : []
            if (missing.length > 0)
              toast.message(
                t("board.movedIncomplete", { fields: missing.map((k) => t(`form.missing.${k}`)).join(", ") }),
              )
          },
          onError: (error) => {
            if (incompleteFields(error).length > 0) {
              toast.message(t("board.incomplete", { title: item.title }), {
                action: { label: t("board.addDetails"), onClick: () => onEdit(item) },
              })
            } else setNotice(errorMessage(error))
          },
        },
      )
      return
    }
    if (!overItem || overItem.id === item.id) return
    const column = status === "draft" ? drafts : ready
    const next = column.filter((i) => i.id !== item.id)
    next.splice(
      column.findIndex((i) => i.id === overItem.id),
      0,
      item,
    )
    const rest = status === "draft" ? ready : drafts
    reorder.mutate(
      [...next, ...rest].map((i) => i.id),
      { onError: (error) => setNotice(errorMessage(error)) },
    )
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t("board.instructions") } }}
      onDragStart={({ active: a }) => setActive(all.find((i) => i.id === a.id) ?? null)}
      onDragEnd={end}
      onDragCancel={() => setActive(null)}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:gap-6">
        {STATUSES.map((status) => (
          <Column
            key={status}
            status={status}
            items={status === "draft" ? drafts : ready}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <DragOverlay>
        {active ? (
          <div className="rounded-card flex cursor-grabbing shadow-lg">
            <ItemCard item={active} />
          </div>
        ) : null}
      </DragOverlay>
      {notice ? (
        <p role="alert" className="text-destructive text-sm">
          {notice}
        </p>
      ) : null}
    </DndContext>
  )
}

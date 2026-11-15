"use client"

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { getReadingListsQuery, putReadingListOrder, putReadingListPin, type ReadingListCard } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, cn } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ReadingListCardView } from "./reading-list-card"

/** The lists in the order the server shows them: pinned first, then the manual order. */
export function inShownOrder(lists: readonly ReadingListCard[]): ReadingListCard[] {
  return [...lists].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.sort_order - b.sort_order)
}

/** Moves one list a place within its group (pinned or not); the list stays when it is at the edge of the group. */
export function movedWithinGroup(lists: readonly ReadingListCard[], id: string, delta: -1 | 1): ReadingListCard[] {
  const from = lists.findIndex((l) => l.id === id)
  const to = from + delta
  const a = lists[from]
  const b = lists[to]
  if (!a || !b || a.pinned !== b.pinned) return [...lists]
  const next = [...lists]
  next[from] = b
  next[to] = a
  return next
}

/** Drag-and-drop reordering for librarians; the same lists with Up/Down buttons and a pin toggle for the keyboard. */
export function SortableReadingLists({ lists }: { lists: ReadingListCard[] }) {
  const t = useT("library.readingList")
  const queryClient = useQueryClient()
  const key = getReadingListsQuery().queryKey
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const shown = inShownOrder(lists)

  const reorder = useMutation({
    mutationFn: (next: ReadingListCard[]) => putReadingListOrder({ ids: next.map((l) => l.id) }),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: key })
      const before = queryClient.getQueryData<ReadingListCard[]>(key)
      // The slots stay where they are; only the lists in them change places.
      const slots = next.map((l) => l.sort_order).sort((a, b) => a - b)
      queryClient.setQueryData<ReadingListCard[]>(
        key,
        next.map((l, i) => ({ ...l, sort_order: slots[i] ?? l.sort_order })),
      )
      return { before }
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(key, context?.before)
      toast.error(t("reorderFailed"))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  })

  const pin = useMutation({
    mutationFn: (list: ReadingListCard) => putReadingListPin(list.id, { pinned: !list.pinned }),
    onSuccess: (_saved, list) => toast.success(t(list.pinned ? "unpinnedDone" : "pinnedDone")),
    onError: () => toast.error(t("pinFailed")),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  })

  function move(id: string, delta: -1 | 1) {
    const next = movedWithinGroup(shown, id, delta)
    if (next.some((l, i) => l.id !== shown[i]?.id)) reorder.mutate(next)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = shown.findIndex((l) => l.id === active.id)
    const to = shown.findIndex((l) => l.id === over.id)
    const moved = shown[from]
    if (!moved || to < 0 || shown[to]?.pinned !== moved.pinned) return
    const next = [...shown]
    next.splice(from, 1)
    next.splice(to, 0, moved)
    reorder.mutate(next)
  }

  const titleOf = (id: unknown) => shown.find((l) => l.id === id)?.title ?? ""
  const placeOf = (id: unknown) => shown.findIndex((l) => l.id === id) + 1

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: { draggable: t("dragInstructions") },
        announcements: {
          onDragStart: ({ active }) => t("dragStart", { title: titleOf(active.id) }),
          onDragOver: ({ over }) => (over ? t("dragOver", { n: placeOf(over.id) }) : undefined),
          onDragEnd: ({ over }) => (over ? t("dragEnd", { n: placeOf(over.id) }) : undefined),
          onDragCancel: () => t("dragCancel"),
        },
      }}
    >
      <SortableContext items={shown.map((l) => l.id)} strategy={rectSortingStrategy}>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((list, index) => (
            <SortableItem
              key={list.id}
              list={list}
              canUp={shown[index - 1]?.pinned === list.pinned && index > 0}
              canDown={shown[index + 1]?.pinned === list.pinned}
              onMove={move}
              onPin={() => pin.mutate(list)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({
  list,
  canUp,
  canDown,
  onMove,
  onPin,
}: {
  list: ReadingListCard
  canUp: boolean
  canDown: boolean
  onMove: (id: string, delta: -1 | 1) => void
  onPin: () => void
}) {
  const t = useT("library.readingList")
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
  })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex flex-col gap-1", isDragging && "relative z-10 opacity-80")}
    >
      <ReadingListCardView list={list} />
      <div className="flex items-center gap-1">
        <Button
          ref={setActivatorNodeRef}
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 cursor-grab touch-none md:min-h-8 md:min-w-8"
          aria-label={t("dragHandle", { title: list.title })}
          {...attributes}
          {...listeners}
        >
          <Icons.gripVertical aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
          disabled={!canUp}
          aria-label={t("moveUp", { title: list.title })}
          onClick={() => onMove(list.id, -1)}
        >
          <Icons.chevronUp aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="min-h-11 min-w-11 md:min-h-8 md:min-w-8"
          disabled={!canDown}
          aria-label={t("moveDown", { title: list.title })}
          onClick={() => onMove(list.id, 1)}
        >
          <Icons.chevronDown aria-hidden />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto min-h-11 md:min-h-8"
          aria-pressed={list.pinned}
          aria-label={t(list.pinned ? "unpin" : "pin", { title: list.title })}
          onClick={onPin}
        >
          {list.pinned ? <Icons.pinFilled aria-hidden /> : <Icons.pin aria-hidden />}
          {t(list.pinned ? "unpinShort" : "pinShort")}
        </Button>
      </div>
    </li>
  )
}

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
  type DragStartEvent,
} from "@dnd-kit/core"
import { ScrollFade } from "@/components/scroll-fade"
import { useFormatters, useT } from "@ihsp/i18n"
import { Icons } from "@ihsp/ui"
import { useState } from "react"
import type { Task } from "../api"
import { useTaskVocab } from "../api"
import { OverdueBadge, PriorityPill, StatusPill } from "./task-common"

function Card({ task, onOpen, overlay }: { task: Task; onOpen?: (task: Task) => void; overlay?: boolean }) {
  const t = useT("tasks")
  const { date } = useFormatters()
  const drag = useDraggable({ id: task.id, disabled: overlay })
  const { done, total } = task.progress
  // The whole card is the drag surface (pointer and touch); the grip is the keyboard handle, so Enter and Space on
  // the title still open the task instead of lifting the card.
  return (
    <div
      ref={drag.setNodeRef}
      {...drag.listeners}
      className={`bg-card rounded-card flex cursor-grab flex-col gap-2 border p-3 text-sm shadow-xs active:cursor-grabbing ${drag.isDragging && !overlay ? "opacity-40" : ""}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          ref={drag.setActivatorNodeRef}
          className="text-muted-foreground focus-visible:ring-ring -m-1 mt-0 rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          aria-label={t("dragHandle", { title: task.title })}
          {...drag.attributes}
        >
          <Icons.gripVertical aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          className="flex-1 text-left font-medium hover:underline"
          aria-label={t("open", { title: task.title })}
          onClick={() => onOpen?.(task)}
        >
          {task.title}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PriorityPill priority={task.priority} />
        {task.overdue ? <OverdueBadge /> : null}
        {task.deadline ? <span className="text-muted-foreground text-xs">{date(task.deadline)}</span> : null}
        {total > 0 ? <span className="text-muted-foreground text-xs">{`${done}/${total}`}</span> : null}
        {task.assigned_by_name ? (
          <span className="text-muted-foreground text-xs">{t("assignedBy", { name: task.assigned_by_name })}</span>
        ) : null}
      </div>
    </div>
  )
}

function Column({ status, tasks, onOpen }: { status: string; tasks: Task[]; onOpen: (task: Task) => void }) {
  const t = useT("tasks")
  const drop = useDroppable({ id: status })
  return (
    <section
      ref={drop.setNodeRef}
      aria-label={t(`status.${status}`)}
      className={`bg-muted/40 flex min-w-44 flex-1 basis-0 flex-col gap-2 rounded-2xl p-3 ${drop.isOver ? "ring-primary/50 ring-2" : ""}`}
    >
      <h3 className="flex items-center justify-between gap-2 text-sm font-medium">
        <StatusPill status={status} />
        <span className="text-muted-foreground">{tasks.length}</span>
      </h3>
      <ScrollFade maxHeight={480} className="flex flex-col gap-2">
        {tasks.map((task) => (
          <Card key={task.id} task={task} onOpen={onOpen} />
        ))}
      </ScrollFade>
    </section>
  )
}

/** Kanban of tasks by status; dropping a card on another column moves the task. */
export function TaskBoard({
  tasks,
  onOpen,
  onMove,
}: {
  tasks: Task[]
  onOpen: (task: Task) => void
  onMove: (task: Task, status: string) => void
}) {
  const vocab = useTaskVocab()
  const t = useT("tasks")
  const titleOf = (id: string | number) => tasks.find((task) => task.id === id)?.title ?? ""
  const columnOf = (id: string | number) => {
    const column = tasks.find((task) => task.id === id)?.status ?? String(id)
    return t(`status.${column}`)
  }
  const announcements: Announcements = {
    onDragStart: ({ active }) => t("board.pickup", { title: titleOf(active.id) }),
    onDragOver: ({ active, over }) =>
      over ? t("board.over", { title: titleOf(active.id), column: columnOf(over.id) }) : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? t("board.drop", { title: titleOf(active.id), column: columnOf(over.id) })
        : t("board.cancel", { title: titleOf(active.id) }),
    onDragCancel: ({ active }) => t("board.cancel", { title: titleOf(active.id) }),
  }
  const [active, setActive] = useState<Task | null>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function start(event: DragStartEvent) {
    setActive(tasks.find((task) => task.id === event.active.id) ?? null)
  }

  function end(event: DragEndEvent) {
    setActive(null)
    const task = tasks.find((item) => item.id === event.active.id)
    const status = event.over ? String(event.over.id) : null
    if (task && status && status !== task.status) onMove(task, status)
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements, screenReaderInstructions: { draggable: t("board.instructions") } }}
      onDragStart={start}
      onDragEnd={end}
      onDragCancel={() => setActive(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {vocab.task_statuses.map((status) => (
          <Column key={status} status={status} tasks={tasks.filter((task) => task.status === status)} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>{active ? <Card task={active} overlay /> : null}</DragOverlay>
    </DndContext>
  )
}

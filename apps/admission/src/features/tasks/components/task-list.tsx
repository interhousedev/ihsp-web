"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import type { Task } from "../api"
import { useTaskVocab } from "../api"
import { OptionSelect, OverdueBadge, PriorityPill } from "./task-common"

/** Tasks as a table from `md` up, as cards below: name, creator, created date, deadline, priority, status, actions. */
export function TaskList({
  tasks,
  onOpen,
  onStatus,
  onDelete,
}: {
  tasks: Task[]
  onOpen: (task: Task) => void
  onStatus: (task: Task, status: string) => void
  onDelete: (task: Task) => void
}) {
  const t = useT("tasks")
  const { date } = useFormatters()
  const vocab = useTaskVocab()
  const statusOptions = vocab.task_statuses.map((value) => ({ value, label: t(`status.${value}`) }))
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {tasks.map((task) => (
          <li key={task.id} className="bg-card rounded-card flex flex-col gap-3 border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                className="min-h-11 flex-1 text-left font-medium hover:underline"
                aria-label={t("open", { title: task.title })}
                onClick={() => onOpen(task)}
              >
                {task.title}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`${t("delete")}: ${task.title}`}
                onClick={() => onDelete(task)}
              >
                <Icons.trash aria-hidden />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityPill priority={task.priority} />
              {task.overdue ? <OverdueBadge /> : null}
              <span className="text-muted-foreground text-xs">
                {task.deadline ? date(task.deadline) : t("noDeadline")}
              </span>
            </div>
            <OptionSelect
              value={task.status}
              onChange={(status) => status && onStatus(task, status)}
              options={statusOptions}
              label={t("statusOf", { title: task.title })}
              className="min-h-11 w-full"
            />
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("col.name")}</TableHead>
              <TableHead>{t("col.creator")}</TableHead>
              <TableHead>{t("col.created")}</TableHead>
              <TableHead>{t("col.deadline")}</TableHead>
              <TableHead>{t("col.priority")}</TableHead>
              <TableHead>{t("col.status")}</TableHead>
              <TableHead className="text-right">{t("col.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="max-w-64 font-medium whitespace-normal">
                  <button
                    type="button"
                    className="text-left hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    aria-label={t("open", { title: task.title })}
                    onClick={() => onOpen(task)}
                  >
                    {task.title}
                  </button>
                </TableCell>
                <TableCell>
                  {task.assigned_by_name ? t("assignedBy", { name: task.assigned_by_name }) : t(`source.${task.created_by}`)}
                </TableCell>
                <TableCell>{task.created_at ? date(task.created_at) : ""}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{task.deadline ? date(task.deadline) : t("noDeadline")}</span>
                    {task.overdue ? <OverdueBadge /> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <PriorityPill priority={task.priority} />
                </TableCell>
                <TableCell>
                  <OptionSelect
                    value={task.status}
                    onChange={(status) => status && onStatus(task, status)}
                    options={statusOptions}
                    label={t("statusOf", { title: task.title })}
                    className="min-h-8 w-40"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`${t("delete")}: ${task.title}`}
                    onClick={() => onDelete(task)}
                  >
                    <Icons.trash aria-hidden />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

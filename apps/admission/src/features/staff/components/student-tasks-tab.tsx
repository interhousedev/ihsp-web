"use client"

import { useFormatters, useT } from "@ihsp/i18n"
import { Button, Icons, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { QueryError } from "../../shell/components/query-error"
import { useTasks } from "../../tasks/api"
import { PriorityPill, StatusPill, OverdueBadge } from "../../tasks/components/task-common"
import { TaskFormDialog } from "../../tasks/components/task-form-dialog"

/** The student's tasks and a form that sets a new one through the staff endpoint; a staff task names who set it. */
export function StudentTasksTab({ studentId }: { studentId: string }) {
  const t = useT("staff")
  const tasksT = useT("tasks")
  const { date } = useFormatters()
  const query = useTasks({}, studentId)
  const [creating, setCreating] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <Button type="button" className="min-h-11 self-start md:min-h-9" onClick={() => setCreating(true)}>
        <Icons.add aria-hidden />
        {t("tasksTab.add")}
      </Button>
      {query.isPending ? (
        <Skeleton className="h-32 w-full" />
      ) : query.isError ? (
        <QueryError error={query.error} onRetry={() => void query.refetch()} section="tasks" />
      ) : query.data.items.length === 0 ? (
        <StateView state="empty" icon={<Icons.homework aria-hidden />} title={t("tasksTab.empty")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {query.data.items.map((task) => (
            <li key={task.id} className="bg-card rounded-card flex flex-col gap-2 border p-3 text-sm">
              <span className="font-medium break-words">{task.title}</span>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill status={task.status} />
                <PriorityPill priority={task.priority} />
                {task.overdue ? <OverdueBadge /> : null}
                <span className="text-muted-foreground text-xs">
                  {task.deadline ? date(task.deadline) : tasksT("noDeadline")}
                </span>
                {task.assigned_by_name ? (
                  <span className="text-muted-foreground text-xs">{t("tasksTab.by", { name: task.assigned_by_name })}</span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      {creating ? <TaskFormDialog studentId={studentId} open onOpenChange={setCreating} /> : null}
    </div>
  )
}

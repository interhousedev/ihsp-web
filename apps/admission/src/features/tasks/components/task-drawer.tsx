"use client"

import { useErrorMessage, useFormatters, useT } from "@ihsp/i18n"
import { Button, Checkbox, Icons, Markdown, Progress, Sheet, SheetContent, SheetHeader, SheetTitle } from "@ihsp/ui"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { useToggleStep, type Task, type TaskLink } from "../api"
import { TaskFormDialog } from "./task-form-dialog"
import { OverdueBadge, PriorityPill, StatusPill } from "./task-common"

/** A link of a task: another site opens in a new tab, a page of this app is a route link. */
export function TaskLinkAnchor({ link }: { link: TaskLink }) {
  const t = useT("tasks")
  if (link.kind === "internal") {
    return (
      <Link href={link.url} className="text-primary underline-offset-2 hover:underline">
        {link.label}
      </Link>
    )
  }
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary inline-flex items-center gap-1 underline-offset-2 hover:underline"
    >
      {link.label}
      <Icons.externalLink aria-hidden className="size-3.5" />
      <span className="sr-only">{t("drawer.newTab")}</span>
    </a>
  )
}

/** The side drawer of a task: description, links and the step checklist with its progress. */
export function TaskDrawer({
  task,
  open,
  onOpenChange,
}: {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("tasks")
  const { date } = useFormatters()
  const errorMessage = useErrorMessage()
  const toggle = useToggleStep()
  const [editing, setEditing] = useState(false)
  const { done, total } = task.progress

  async function tick(stepId: string, value: boolean) {
    try {
      await toggle.mutateAsync({ taskId: task.id, stepId, done: value })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{task.title}</SheetTitle>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={task.status} />
              <PriorityPill priority={task.priority} />
              {task.overdue ? <OverdueBadge /> : null}
              {task.assigned_by_name ? (
                <span className="text-muted-foreground text-xs">
                  {t("assignedBy", { name: task.assigned_by_name })}
                </span>
              ) : null}
            </div>
          </SheetHeader>
          <div className="flex flex-col gap-5 px-4 pb-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">{t("drawer.start")}</dt>
                <dd>{task.start_date ? date(task.start_date) : t("drawer.notSet")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">{t("drawer.deadline")}</dt>
                <dd>{task.deadline ? date(task.deadline) : t("noDeadline")}</dd>
              </div>
            </dl>
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{t("drawer.description")}</h3>
              {task.description ? (
                <Markdown>{task.description}</Markdown>
              ) : (
                <p className="text-muted-foreground text-sm">{t("drawer.noDescription")}</p>
              )}
            </section>
            {task.links.length > 0 ? (
              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">{t("drawer.links")}</h3>
                <ul className="flex flex-col gap-1 text-sm">
                  {task.links.map((link) => (
                    <li key={`${link.kind}:${link.url}`}>
                      <TaskLinkAnchor link={link} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">{t("drawer.steps")}</h3>
              {total > 0 ? (
                <Progress value={Math.round((done / total) * 100)} aria-label={t("drawer.progress", { done, total })}>
                  <span className="text-muted-foreground text-xs">{t("drawer.progress", { done, total })}</span>
                </Progress>
              ) : (
                <p className="text-muted-foreground text-sm">{t("drawer.noSteps")}</p>
              )}
              <ul className="flex flex-col gap-2">
                {task.steps.map((step) => (
                  <li key={step.id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      aria-label={step.title}
                      checked={step.done}
                      disabled={toggle.isPending}
                      onCheckedChange={(value) => void tick(step.id, value === true)}
                      className="mt-0.5 size-5 border-2 border-muted-foreground transition-transform duration-200 data-checked:scale-110"
                    />
                    <span
                      className={
                        step.done ? "text-muted-foreground line-through transition-colors" : "transition-colors"
                      }
                    >
                      {step.title}
                    </span>
                    {step.link ? <TaskLinkAnchor link={step.link} /> : null}
                  </li>
                ))}
              </ul>
            </section>
            <Button type="button" variant="outline" className="w-fit" onClick={() => setEditing(true)}>
              <Icons.edit aria-hidden />
              {t("drawer.edit")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      {editing ? <TaskFormDialog task={task} open onOpenChange={setEditing} /> : null}
    </>
  )
}

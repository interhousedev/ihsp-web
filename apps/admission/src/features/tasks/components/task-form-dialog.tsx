"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { RichTextEditor } from "@ihsp/features-core/rich-text"
import { Button, Icons, Input, LoadingButton, ResponsiveDialog } from "@ihsp/ui"
import { useState, type FormEvent } from "react"
import {
  clearProblemToast,
  fieldCopy,
  fieldMessage,
  problemField,
  showProblemToast,
  type FieldProblem,
} from "../../../lib/problem-fields"
import {
  useCreateTask,
  useTaskVocab,
  useUpdateTask,
  type Task,
  type TaskLink,
  type TaskPriority,
  type TaskStepIn,
} from "../api"
import { OptionSelect } from "./task-common"

function FieldError({ message }: { message?: string }) {
  return message ? (
    <span role="alert" className="text-destructive text-xs">
      {message}
    </span>
  ) : null
}

/** Create (no `task`) or edit a task: title, description, dates, priority, steps and links. */
export function TaskFormDialog({
  task,
  studentId,
  open,
  onOpenChange,
}: {
  task?: Task
  studentId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("tasks")
  const vocab = useTaskVocab()
  const errorMessage = useErrorMessage()
  const create = useCreateTask(studentId)
  const update = useUpdateTask()
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? (vocab.task_priorities[1] as TaskPriority | undefined) ?? "medium",
  )
  const [start, setStart] = useState(task?.start_date ?? "")
  const [deadline, setDeadline] = useState(task?.deadline ?? "")
  const [steps, setSteps] = useState<TaskStepIn[]>(task?.steps ?? [])
  const [links, setLinks] = useState<TaskLink[]>(task?.links ?? [])
  const [problem, setProblem] = useState<FieldProblem | null>(null)
  const copy = {
    deadline: t("form.problems.deadline"),
    start_date: t("form.problems.start"),
    "link.url": t("form.problems.linkUrl"),
    "link.label": t("form.problems.linkLabel"),
  }
  const linkProblem = fieldCopy(problem, copy, "links", "link")
  const pending = create.isPending || update.isPending

  function patchStep(index: number, next: Partial<TaskStepIn>) {
    setSteps((all) => all.map((step, i) => (i === index ? { ...step, ...next } : step)))
  }

  function patchLink(index: number, next: Partial<TaskLink>) {
    setLinks((all) => all.map((link, i) => (i === index ? { ...link, ...next } : link)))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const body = {
      title: title.trim(),
      description,
      priority,
      start_date: start || null,
      deadline: deadline || null,
      steps: steps.filter((step) => step.title.trim()).map((step) => ({ ...step, title: step.title.trim() })),
      links: links.filter((link) => link.url.trim() && link.label.trim()),
    }
    setProblem(null)
    const badLink = links.find((link) => link.kind === "external" && !/^https?:\/\/\S+$/i.test(link.url.trim()))
    if (badLink) {
      setProblem({ field: "link.url", title: copy["link.url"] })
      return
    }
    try {
      if (task) await update.mutateAsync({ id: task.id, lock_version: task.lock_version, ...body })
      else await create.mutateAsync(body)
      clearProblemToast()
      onOpenChange(false)
    } catch (error) {
      const found = problemField(error)
      if (found) setProblem(found)
      else showProblemToast(errorMessage(error))
    }
  }

  const priorityOptions = vocab.task_priorities.map((value) => ({ value, label: t(`priority.${value}`) }))
  const kindOptions = vocab.task_link_kinds.map((value) => ({ value, label: t(`form.kind.${value}`) }))

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={task ? t("form.editTitle") : t("form.createTitle")}
      onSubmit={submit}
      footer={
        <LoadingButton type="submit" loading={pending} disabled={!title.trim()}>
          {t("form.save")}
        </LoadingButton>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("form.name")}
          <Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} required />
          <FieldError message={fieldMessage(problem, "title")} />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          {t("form.description")}
          <RichTextEditor
            value={description}
            onChange={setDescription}
            ariaLabel={t("form.description")}
            minHeight="8rem"
            invalid={fieldMessage(problem, "description") !== undefined}
          />
          <FieldError message={fieldMessage(problem, "description")} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            {t("form.start")}
            <Input
              type="date"
              value={start}
              aria-invalid={fieldMessage(problem, "start_date") ? true : undefined}
              onChange={(e) => setStart(e.target.value)}
            />
            <FieldError message={fieldCopy(problem, copy, "start_date")} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("form.deadline")}
            <Input
              type="date"
              value={deadline}
              aria-invalid={fieldMessage(problem, "deadline") ? true : undefined}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <FieldError message={fieldCopy(problem, copy, "deadline")} />
          </label>
        </div>
        <OptionSelect
          value={priority}
          onChange={(value) => value && setPriority(value as TaskPriority)}
          options={priorityOptions}
          label={t("form.priority")}
          className="min-h-11 w-full md:min-h-8"
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("form.steps")}</legend>
          {steps.map((step, index) => (
            <div key={step.id ?? index} className="flex items-center gap-2">
              <Input
                aria-label={t("form.stepTitle")}
                value={step.title}
                onChange={(e) => patchStep(index, { title: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("form.remove")}
                onClick={() => setSteps((all) => all.filter((_, i) => i !== index))}
              >
                <Icons.trash aria-hidden />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() => setSteps((all) => [...all, { title: "", done: false }])}
          >
            <Icons.add aria-hidden />
            {t("form.addStep")}
          </Button>
          <FieldError message={fieldMessage(problem, "steps")} />
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">{t("form.links")}</legend>
          {links.map((link, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2">
              <Input
                aria-label={t("form.linkLabel")}
                placeholder={t("form.linkLabel")}
                className="min-w-32 flex-1"
                value={link.label}
                onChange={(e) => patchLink(index, { label: e.target.value })}
              />
              <Input
                aria-label={t("form.linkUrl")}
                placeholder={t("form.linkUrl")}
                className="min-w-32 flex-1"
                value={link.url}
                aria-invalid={linkProblem !== undefined || undefined}
                onChange={(e) => patchLink(index, { url: e.target.value })}
              />
              <OptionSelect
                value={link.kind}
                onChange={(kind) => kind && patchLink(index, { kind: kind as TaskLink["kind"] })}
                options={kindOptions}
                label={t("form.linkKind")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t("form.remove")}
                onClick={() => setLinks((all) => all.filter((_, i) => i !== index))}
              >
                <Icons.trash aria-hidden />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-fit"
            onClick={() =>
              setLinks((all) => [
                ...all,
                { label: "", url: "", kind: (vocab.task_link_kinds[0] as TaskLink["kind"] | undefined) ?? "external" },
              ])
            }
          >
            <Icons.add aria-hidden />
            {t("form.addLink")}
          </Button>
          <FieldError message={linkProblem} />
        </fieldset>
      </div>
    </ResponsiveDialog>
  )
}

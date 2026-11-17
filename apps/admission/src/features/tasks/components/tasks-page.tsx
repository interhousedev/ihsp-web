"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Pill, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { ScrollFade } from "@/components/scroll-fade"
import { useEffect, useState } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { showProblemToast } from "../../../lib/problem-fields"
import {
  useDeleteTask,
  useTasks,
  useTaskVocab,
  useUpdateTask,
  type Task,
  type TaskFilters,
  type TaskStatus,
} from "../api"
import { SuggestDialog } from "./suggest-dialog"
import { OptionSelect } from "./task-common"
import { TaskBoard } from "./task-board"
import { TaskDrawer } from "./task-drawer"
import { TaskFormDialog } from "./task-form-dialog"
import { TaskList } from "./task-list"
import { TaskTimeline } from "./task-timeline"

type View = "list" | "board" | "timeline"
const VIEWS: View[] = ["list", "board", "timeline"]
const VIEW_KEY = "admission.tasks.view"

/** Tasks of the signed-in student: filters, list / board / timeline views, drawer and dialogs. */
export function TasksBody() {
  const t = useT("tasks")
  const vocab = useTaskVocab()
  const errorMessage = useErrorMessage()
  const [view, setView] = useState<View>("list")
  const [filters, setFilters] = useState<TaskFilters>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [removing, setRemoving] = useState<Task | null>(null)
  const tasks = useTasks(filters)
  const update = useUpdateTask()
  const remove = useDeleteTask()
  const items = tasks.data?.items ?? []
  const opened = items.find((task) => task.id === openId)
  const filtered = Object.values(filters).some(Boolean)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY)
      const known = VIEWS.find((item) => item === saved)
      if (known) setView(known)
    } catch {
      // storage unavailable: keep the default view
    }
  }, [])

  function chooseView(next: View) {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // storage unavailable: the choice is just not remembered
    }
  }

  async function move(task: Task, status: TaskStatus) {
    try {
      await update.mutateAsync({ id: task.id, status, lock_version: task.lock_version })
    } catch (error) {
      showProblemToast(errorMessage(error))
    }
  }

  async function confirmDelete() {
    if (!removing) return
    try {
      await remove.mutateAsync(removing.id)
      setRemoving(null)
    } catch (error) {
      showProblemToast(errorMessage(error))
    }
  }

  function setFilter(key: keyof TaskFilters, value: string | undefined) {
    setFilters((all) => ({ ...all, [key]: value }))
  }

  const options = (kind: "status" | "priority" | "source" | "horizon", values: string[]) =>
    values.map((value) => ({ value, label: t(`${kind}.${value}`) }))

  const filterSpecs = [
    { key: "status", values: vocab.task_statuses },
    { key: "priority", values: vocab.task_priorities },
    { key: "source", values: vocab.task_sources },
    { key: "horizon", values: vocab.task_horizons },
  ] as const
  const stats = {
    open: items.filter((task) => task.status !== "done").length,
    overdue: items.filter((task) => task.overdue).length,
    done: items.filter((task) => task.status === "done").length,
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-6">
      <aside
        aria-label={t("overview")}
        className="grid grid-cols-3 gap-2 xl:col-start-2 xl:row-start-1 xl:flex xl:flex-col xl:content-start"
      >
        {(["open", "overdue", "done"] as const).map((key) => (
          <div
            key={key}
            className="border-hairline bg-card rounded-card flex flex-col gap-1 border p-3 xl:flex-row xl:items-center xl:justify-between"
          >
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {key === "overdue" ? (
                <Icons.alertCircle aria-hidden className="text-destructive size-4" />
              ) : key === "done" ? (
                <Icons.check aria-hidden className="text-success size-4" />
              ) : (
                <Icons.clock aria-hidden className="text-primary size-4" />
              )}
              {t(`stats.${key}`)}
            </span>
            <Pill tone={key === "overdue" ? "danger" : key === "done" ? "success" : "primary"}>{stats[key]}</Pill>
          </div>
        ))}
      </aside>
      <div className="flex min-w-0 flex-col gap-4 xl:col-start-1 xl:row-start-1">
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(value) => chooseView(VIEWS.find((item) => item === value) ?? "list")}>
            <TabsList variant="line" aria-label={t("view.label")} className="max-sm:h-14">
              {VIEWS.map((item) => (
                <TabsTrigger key={item} value={item} className="min-h-11 md:min-h-9">
                  {t(`view.${item}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setSuggesting(true)}>
              <Icons.sparkles aria-hidden />
              {t("suggest")}
            </Button>
            <Button type="button" onClick={() => setCreating(true)}>
              <Icons.add aria-hidden />
              {t("add")}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
          {filterSpecs.map(({ key, values }) => (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{t(`filters.${key}`)}</span>
              <OptionSelect
                value={filters[key]}
                onChange={(v) => setFilter(key, v)}
                options={options(key, values)}
                label={t(`filters.${key}`)}
                allLabel={t("filters.all")}
              />
            </div>
          ))}
        </div>
        {tasks.isPending ? (
          <StateView state="loading" />
        ) : tasks.isError ? (
          <StateView state="error" error={tasks.error} onRetry={() => void tasks.refetch()} />
        ) : items.length === 0 ? (
          <StateView state="empty" emptyText={filtered ? t("emptyFiltered") : t("empty")} />
        ) : view === "list" ? (
          <ScrollFade maxHeight="70vh">
            <TaskList
              tasks={items}
              onOpen={(task) => setOpenId(task.id)}
              onStatus={(task, status) => void move(task, status as TaskStatus)}
              onDelete={setRemoving}
            />
          </ScrollFade>
        ) : view === "board" ? (
          <TaskBoard
            tasks={items}
            onOpen={(task) => setOpenId(task.id)}
            onMove={(task, status) => void move(task, status as TaskStatus)}
          />
        ) : (
          <ScrollFade maxHeight="70vh">
            <TaskTimeline tasks={items} onOpen={(task) => setOpenId(task.id)} />
          </ScrollFade>
        )}
      </div>
      {opened ? <TaskDrawer task={opened} open onOpenChange={(open) => !open && setOpenId(null)} /> : null}
      {creating ? <TaskFormDialog open onOpenChange={setCreating} /> : null}
      {suggesting ? <SuggestDialog open onOpenChange={setSuggesting} /> : null}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("delete")}
        description={t("deleteConfirm")}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}

export function TasksPage() {
  const t = useT("tasks")
  return (
    <AdmissionShell>
      <div className={pageClass("wide")}>
        <AppPageHeader icon="kanban" title={t("title")} />
        <TasksBody />
      </div>
    </AdmissionShell>
  )
}

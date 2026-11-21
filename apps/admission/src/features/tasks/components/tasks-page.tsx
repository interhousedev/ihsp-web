"use client"

import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, Pill, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { ScrollFade } from "@/components/scroll-fade"
import { useRouter, useSearchParams } from "next/navigation"
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
import { DeadlinesGantt } from "../../deadlines/components/deadlines-gantt"
import { SuggestDialog } from "./suggest-dialog"
import { OptionSelect } from "./task-common"
import { TaskBoard } from "./task-board"
import { TaskDrawer } from "./task-drawer"
import { TaskFormDialog, type TaskPrefill } from "./task-form-dialog"
import { TaskList } from "./task-list"

type View = "gantt" | "board" | "list"
const VIEWS: View[] = ["gantt", "board", "list"]
/** Message key of a view tab (the timeline kept its old key). */
const VIEW_LABEL: Record<View, string> = { gantt: "deadlines", board: "board", list: "list" }

const asView = (value: string | null): View => VIEWS.find((item) => item === value) ?? "gantt"

/**
 * Tasks of the signed-in student: the deadlines timeline (default), board and list, with filters, drawer and
 * dialogs. The view lives in the URL (`?view=`), so a bare `/tasks/` always opens the timeline; `?task=` opens that
 * task and `?uni=` scrolls the timeline to a university of the list.
 */
export function TasksBody() {
  const t = useT("tasks")
  const vocab = useTaskVocab()
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const params = useSearchParams()
  const [view, setView] = useState<View>(asView(params.get("view")))
  const [filters, setFilters] = useState<TaskFilters>({})
  const [openId, setOpenId] = useState<string | null>(params.get("task"))
  const [creating, setCreating] = useState<TaskPrefill | null>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [removing, setRemoving] = useState<Task | null>(null)
  const tasks = useTasks(filters)
  const update = useUpdateTask()
  const remove = useDeleteTask()
  const items = tasks.data?.items ?? []
  const opened = items.find((task) => task.id === openId)
  const filtered = Object.values(filters).some(Boolean)
  const taskParam = params.get("task")
  const viewParam = params.get("view")

  useEffect(() => {
    setView(asView(viewParam))
  }, [viewParam])

  useEffect(() => {
    if (taskParam) setOpenId(taskParam)
  }, [taskParam])

  function chooseView(next: View) {
    setView(next)
    // The timeline always shows every task, so a filter left over from another view cannot hide the opened one.
    if (next === "gantt") setFilters({})
    router.replace(`/tasks/?view=${next}`)
  }

  function closeTask() {
    setOpenId(null)
    if (taskParam) router.replace(`/tasks/?view=${view}`)
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
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Tabs value={view} onValueChange={(value) => chooseView(asView(value))}>
          <TabsList variant="line" aria-label={t("view.label")}>
            {VIEWS.map((item) => (
              <TabsTrigger key={item} value={item} className="min-h-11 md:min-h-9">
                {t(`view.${VIEW_LABEL[item]}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <ul aria-label={t("overview")} className="flex items-center gap-1.5">
          {(["open", "overdue", "done"] as const).map((key) => (
            <li key={key}>
              <Pill
                tone={key === "overdue" ? "danger" : key === "done" ? "success" : "primary"}
                title={`${t(`stats.${key}`)}: ${stats[key]}`}
                className="gap-1"
              >
                <span className="max-lg:sr-only">{t(`stats.${key}`)}</span>
                {stats[key]}
              </Pill>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSuggesting(true)}
            aria-label={t("suggest")}
            className="max-sm:size-11 max-sm:p-0"
          >
            <Icons.sparkles aria-hidden />
            <span className="max-sm:sr-only">{t("suggest")}</span>
          </Button>
          <Button
            type="button"
            onClick={() => setCreating({})}
            aria-label={t("add")}
            className="max-sm:size-11 max-sm:p-0"
          >
            <Icons.add aria-hidden />
            <span className="max-sm:sr-only">{t("add")}</span>
          </Button>
        </div>
      </div>
      {view === "gantt" ? null : (
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
      )}
      {view === "gantt" ? (
        <DeadlinesGantt onOpenTask={setOpenId} onCreate={setCreating} focusEntry={params.get("uni")} />
      ) : tasks.isPending ? (
        <StateView state="loading" />
      ) : tasks.isError ? (
        <StateView state="error" error={tasks.error} onRetry={() => void tasks.refetch()} />
      ) : items.length === 0 ? (
        <StateView state="empty" emptyText={filtered ? t("emptyFiltered") : t("empty")} />
      ) : view === "board" ? (
        <TaskBoard
          tasks={items}
          onOpen={(task) => setOpenId(task.id)}
          onMove={(task, status) => void move(task, status as TaskStatus)}
        />
      ) : (
        <ScrollFade maxHeight="70vh">
          <TaskList
            tasks={items}
            onOpen={(task) => setOpenId(task.id)}
            onStatus={(task, status) => void move(task, status as TaskStatus)}
            onDelete={setRemoving}
          />
        </ScrollFade>
      )}
      {opened ? <TaskDrawer task={opened} open onOpenChange={(open) => !open && closeTask()} /> : null}
      {creating ? <TaskFormDialog open prefill={creating} onOpenChange={(open) => !open && setCreating(null)} /> : null}
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
      <div className={pageClass()}>
        <AppPageHeader icon="kanban" title={t("title")} />
        <TasksBody />
      </div>
    </AdmissionShell>
  )
}

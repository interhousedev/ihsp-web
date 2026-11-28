"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, PageHeader, Pill, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { NextStep } from "../../../components/next-step"
import { pageClass } from "../../../components/lib/page"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useAdmissionConfig } from "../../../lib/config"
import { useDeleteItem, useItems, type Item, type ItemKind, type ItemStatus } from "../api"
import { useGoalPlan } from "../goal-plan"
import { EmptySuggestions } from "./empty-suggestions"
import { EditItemDialog } from "./edit-item-dialog"
import { ItemAnalytics } from "./item-analytics"
import { HonorDistribution, HonorSuggestionsRow } from "./honor-suggestions"
import { ItemBoard } from "./item-board"
import { emptyForm, toForm } from "./item-fields"
import { NewItemDialog } from "./new-item-dialog"

const STATUSES: ItemStatus[] = ["draft", "ready"]
const TONE = { draft: "warning", ready: "success" } as const
const KINDS: ItemKind[] = ["activity", "honor"]
/** The backend names the caps by the plural of the kind. */
const CAP_KEY: Record<ItemKind, string> = { activity: "activities", honor: "honors" }

/** Activities and honors in two tabs (`?kind=`), reorderable by drag or keyboard. */
export function ItemList() {
  const t = useT("items")
  const router = useRouter()
  const params = useSearchParams()
  const kind: ItemKind = params.get("kind") === "honor" ? "honor" : "activity"
  const items = useItems()
  const caps = useAdmissionConfig().data?.item_caps
  const cap = caps?.[CAP_KEY[kind]]
  const remove = useDeleteItem()
  const errorMessage = useErrorMessage()
  const pathname = usePathname()
  const itemParam = params.get("item")
  const fromParam = params.get("from")
  const seen = useRef(new Set<string>())
  const editing = itemParam && itemParam !== "new" ? items.data?.find((i) => i.id === itemParam) : undefined
  const goalPlan = useGoalPlan()
  const milestone = fromParam ? goalPlan.data?.items.find((m) => m.id === fromParam) : undefined
  const planned = fromParam ? items.data?.find((i) => i.id === (milestone?.item_id ?? fromParam)) : undefined
  /** Rewrites the query string; opening pushes a history entry so Back closes the popup, closing replaces it. */
  const setParams = (change: (next: URLSearchParams) => void, push = false) => {
    const next = new URLSearchParams(params.toString())
    change(next)
    const query = next.toString()
    const href = query ? `${pathname}?${query}` : pathname
    if (push) router.push(href)
    else router.replace(href)
  }
  const closeItem = () =>
    setParams((next) => {
      next.delete("item")
      next.delete("from")
    })
  const openItem = (item: Item) => setParams((next) => next.set("item", item.id), true)
  if (editing) seen.current.add(editing.id)
  const unknown = Boolean(
    itemParam && itemParam !== "new" && items.isSuccess && !editing && !seen.current.has(itemParam),
  )
  const creating = itemParam === "new" && (!fromParam || (items.isSuccess && !goalPlan.isPending))
  useEffect(() => {
    if (!unknown) return
    toast.error(t("notFound"))
    closeItem()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- closeItem is rebuilt every render; `unknown` is the trigger
  }, [unknown])
  const [deleting, setDeleting] = useState<Item | null>(null)
  const ofKind = items.data?.filter((i) => i.kind === kind).sort((a, b) => a.position - b.position) ?? []
  const drafts = ofKind.filter((i) => i.status === "draft")
  const ready = ofKind.filter((i) => i.status === "ready")
  const draftFull = caps?.drafts !== undefined && drafts.length >= caps.drafts

  return (
    <>
      <div className={pageClass("lg:h-[calc(100dvh-var(--shell-top-reserve,0px)-3rem)] lg:min-h-0 lg:pb-4")}>
        <PageHeader back={<Icons.sparkles aria-hidden className="text-primary size-7" />} title={t("title")} />
        <Tabs value={kind} onValueChange={(value) => router.replace(`/activities/?kind=${value}`)}>
          <TabsList variant="line">
            {KINDS.map((k) => (
              <TabsTrigger key={k} value={k} className="gap-2">
                {k === "honor" ? <Icons.certificates aria-hidden /> : <Icons.sparkles aria-hidden />}
                {t(`tabs.${k}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {STATUSES.map((status) => (
              <Pill key={status} tone={TONE[status]} className="gap-1.5">
                {t(`column.${status}`)}
                <span className="font-semibold">{(status === "draft" ? drafts : ready).length}</span>
              </Pill>
            ))}
            <p className="text-muted-foreground text-sm">
              {cap === undefined
                ? t("countOpen", { count: ready.length })
                : ready.length >= cap
                  ? t("capReached", { max: cap })
                  : t("count", { count: ready.length, max: cap })}
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={draftFull}
            onClick={() => setParams((next) => next.set("item", "new"), true)}
          >
            <Icons.add aria-hidden />
            {t("add")}
          </Button>
        </div>
        <div className="flex min-w-0 flex-col gap-5 md:gap-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
          {kind === "honor" ? <HonorSuggestionsRow /> : null}
          {items.isPending ? <StateView state="loading" /> : null}
          {items.isError ? <StateView state="error" error={items.error} onRetry={() => items.refetch()} /> : null}
          {items.isSuccess && ofKind.length === 0 ? (
            <div className="md:hidden">
              <StateView
                state="empty"
                title={t(`empty.${kind}.title`)}
                description={t(`empty.${kind}.text`)}
                icon={kind === "honor" ? <Icons.certificates aria-hidden /> : <Icons.sparkles aria-hidden />}
                action={
                  <Button
                    type="button"
                    disabled={draftFull}
                    onClick={() => setParams((next) => next.set("item", "new"), true)}
                  >
                    <Icons.add aria-hidden />
                    {t("add")}
                  </Button>
                }
              />
            </div>
          ) : null}
          {items.isSuccess ? (
            <div key={kind} className={ofKind.length === 0 ? "hidden md:block" : undefined}>
              <ItemBoard drafts={drafts} ready={ready} onEdit={openItem} onDelete={setDeleting} />
            </div>
          ) : null}
          {items.isSuccess && (kind === "activity" || items.data.length === 0) ? (
            <EmptySuggestions collapsed={items.data.length > 0} />
          ) : null}
          {kind === "honor" && items.isSuccess ? <HonorDistribution items={ofKind} /> : null}
          {kind === "activity" && ofKind.length > 0 ? <ItemAnalytics items={ofKind} /> : null}
          <NextStep href="/chooser/?step=match" label={t("nextStep.explore")} hint={t("nextStep.exploreHint")} />
        </div>
      </div>
      {creating ? (
        <NewItemDialog
          key={fromParam ?? "new"}
          kind={planned && planned.kind === "honor" ? "honor" : kind}
          open
          initial={
            planned
              ? { ...toForm(planned), status: "draft", ...(milestone ? { title: milestone.title } : {}) }
              : milestone
                ? { ...emptyForm, title: milestone.title }
                : emptyForm
          }
          onOpenChange={(open) => !open && closeItem()}
          onCreated={closeItem}
        />
      ) : null}
      {editing ? <EditItemDialog key={editing.id} item={editing} onClose={closeItem} /> : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("delete.title")}
        description={t("delete.text")}
        confirmLabel={t("delete.button")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, {
            onSuccess: () => toast.success(t("delete.done", { title: deleting.title })),
            onError: (error) => toast.error(errorMessage(error)),
            onSettled: () => setDeleting(null),
          })
        }}
      />
    </>
  )
}

export function ItemListPage() {
  return (
    <AdmissionShell>
      <ItemList />
    </AdmissionShell>
  )
}

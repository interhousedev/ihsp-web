"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import {
  Button,
  ConfirmDialog,
  Icons,
  PageHeader,
  Pill,
  SortableList,
  StateView,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { ScrollFade } from "@/components/scroll-fade"
import { useAdmissionConfig } from "../../../lib/config"
import { useDeleteItem, useItems, useReorderItems, type Item, type ItemKind, type ItemStatus } from "../api"
import { EditItemDialog } from "./edit-item-dialog"
import { ItemCard } from "./item-card"
import { NewItemDialog } from "./new-item-dialog"

const STATUSES: ItemStatus[] = ["draft", "ready"]
const TONE = { draft: "warning", ready: "success" } as const
const KINDS: ItemKind[] = ["activity", "honor"]
/** The backend names the caps by the plural of the kind. */
const CAP_KEY: Record<ItemKind, string> = { activity: "activities", honor: "honors" }

/** Activities and honors in two tabs (`?kind=`), reorderable by drag or keyboard. */
export function ItemList() {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const params = useSearchParams()
  const kind: ItemKind = params.get("kind") === "honor" ? "honor" : "activity"
  const items = useItems()
  const caps = useAdmissionConfig().data?.item_caps
  const cap = caps?.[CAP_KEY[kind]]
  const reorder = useReorderItems()
  const remove = useDeleteItem()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState<Item | null>(null)
  const [order, setOrder] = useState<{ status: ItemStatus; items: Item[] } | null>(null)

  const ofKind = items.data?.filter((i) => i.kind === kind).sort((a, b) => a.position - b.position) ?? []
  const drafts = ofKind.filter((i) => i.status === "draft")
  const ready = ofKind.filter((i) => i.status === "ready")
  const draftFull = caps?.drafts !== undefined && drafts.length >= caps.drafts

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:max-w-5xl md:p-6 xl:max-w-6xl">
        <PageHeader back={<Icons.sparkles aria-hidden className="text-primary size-7" />} title={t("title")} />
        <Tabs
          value={kind}
          onValueChange={(value) => {
            setOrder(null)
            router.replace(`/activities/?kind=${value}`)
          }}
        >
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
          <Button type="button" size="sm" disabled={draftFull} onClick={() => setAdding(true)}>
            <Icons.add aria-hidden />
            {t("add")}
          </Button>
        </div>
        {items.isPending ? <StateView state="loading" /> : null}
        {items.isError ? <StateView state="error" error={items.error} onRetry={() => items.refetch()} /> : null}
        {items.isSuccess && ofKind.length === 0 ? (
          <StateView
            state="empty"
            title={t(`empty.${kind}.title`)}
            description={t(`empty.${kind}.text`)}
            icon={kind === "honor" ? <Icons.certificates aria-hidden /> : <Icons.sparkles aria-hidden />}
          />
        ) : null}
        {ofKind.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:gap-6">
            {STATUSES.map((status) => {
              const column = status === "draft" ? drafts : ready
              const shown =
                order?.status === status &&
                order.items.length === column.length &&
                order.items.every((o) => column.some((i) => i.id === o.id))
                  ? order.items
                  : column
              return (
                <section key={status} aria-label={t(`column.${status}`)} className="flex min-w-0 flex-col gap-2">
                  <h2 className="flex items-center gap-2 text-sm font-medium">
                    {t(`column.${status}`)}
                    <Pill tone={TONE[status]} className="h-5 px-2 text-xs">
                      {column.length}
                    </Pill>
                  </h2>
                  {column.length === 0 ? (
                    <p className="text-muted-foreground border-hairline rounded-card border border-dashed p-4 text-sm">
                      {t(`column.empty.${status}`)}
                    </p>
                  ) : (
                    <ScrollFade maxHeight="65vh">
                      <SortableList
                        items={shown}
                        label={t(`column.${status}`)}
                        handleLabel={t("dragHandle", { title: t(`column.${status}`) })}
                        onReorder={(next) => {
                          setOrder({ status, items: next })
                          const rest = status === "draft" ? ready : drafts
                          reorder.mutate(
                            [...next, ...rest].map((i) => i.id),
                            { onSettled: () => setOrder(null) },
                          )
                        }}
                        renderItem={(item) => <ItemCard item={item} onEdit={setEditing} onDelete={setDeleting} />}
                      />
                    </ScrollFade>
                  )}
                </section>
              )
            })}
          </div>
        ) : null}
        {reorder.isError ? (
          <p role="alert" className="text-destructive text-sm">
            {errorMessage(reorder.error)}
          </p>
        ) : null}
      </div>
      <NewItemDialog
        kind={kind}
        open={adding}
        onOpenChange={setAdding}
        onCreated={(id) => router.push(`/activities/view/?id=${encodeURIComponent(id)}`)}
      />
      {editing ? <EditItemDialog key={editing.id} item={editing} onClose={() => setEditing(null)} /> : null}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("delete.title")}
        description={t("delete.text")}
        confirmLabel={t("delete.button")}
        destructive
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id)
          setDeleting(null)
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

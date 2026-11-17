"use client"

import { useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, Icons, PageHeader, Pill, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useAdmissionConfig } from "../../../lib/config"
import { useDeleteItem, useItems, type Item, type ItemKind, type ItemStatus } from "../api"
import { EditItemDialog } from "./edit-item-dialog"
import { ItemAnalytics } from "./item-analytics"
import { ItemBoard } from "./item-board"
import { ItemCard } from "./item-card"
import { NewItemDialog } from "./new-item-dialog"
import { WhatIfCard } from "./what-if-card"

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
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState<Item | null>(null)
  const ofKind = items.data?.filter((i) => i.kind === kind).sort((a, b) => a.position - b.position) ?? []
  const drafts = ofKind.filter((i) => i.status === "draft")
  const ready = ofKind.filter((i) => i.status === "ready")
  const draftFull = caps?.drafts !== undefined && drafts.length >= caps.drafts

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:max-w-5xl md:p-6 xl:max-w-6xl">
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
        {ofKind.length > 0 && kind === "activity" ? (
          <ItemBoard drafts={drafts} ready={ready} onEdit={setEditing} onDelete={setDeleting} />
        ) : null}
        {ofKind.length > 0 && kind === "honor" ? (
          <ul
            aria-label={t("honorsScroll")}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:px-0"
          >
            {ofKind.map((item) => (
              <li key={item.id} className="w-72 shrink-0 snap-start">
                <ItemCard item={item} onEdit={setEditing} onDelete={setDeleting} className="h-full" />
              </li>
            ))}
          </ul>
        ) : null}
        {kind === "activity" && ofKind.length > 0 ? <ItemAnalytics items={ofKind} /> : null}
        {kind === "activity" ? <WhatIfCard /> : null}
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

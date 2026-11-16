"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Icons, PageHeader, SortableList, StateView, Tabs, TabsList, TabsTrigger } from "@ihsp/ui"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { useAdmissionConfig } from "../../../lib/config"
import { useItems, useReorderItems, type Item, type ItemKind } from "../api"
import { ItemCard } from "./item-card"
import { NewItemDialog } from "./new-item-dialog"

const KINDS: ItemKind[] = ["activity", "honor"]

/** Activities and honors in two tabs (`?kind=`), reorderable by drag or keyboard. */
export function ItemList() {
  const t = useT("items")
  const errorMessage = useErrorMessage()
  const router = useRouter()
  const params = useSearchParams()
  const kind: ItemKind = params.get("kind") === "honor" ? "honor" : "activity"
  const items = useItems()
  const cap = useAdmissionConfig().data?.item_caps?.[`${kind}s`] ?? Number.POSITIVE_INFINITY
  const reorder = useReorderItems()
  const [adding, setAdding] = useState(false)
  const [order, setOrder] = useState<Item[] | null>(null)

  const ofKind = items.data?.filter((i) => i.kind === kind).sort((a, b) => a.position - b.position) ?? []
  const shown =
    order && order.every((o) => ofKind.some((i) => i.id === o.id)) && order.length === ofKind.length ? order : ofKind
  const full = ofKind.length >= cap

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
        <PageHeader title={t("title")} />
        <Tabs
          value={kind}
          onValueChange={(value) => {
            setOrder(null)
            router.replace(`/activities/?kind=${value}`)
          }}
        >
          <TabsList>
            {KINDS.map((k) => (
              <TabsTrigger key={k} value={k}>
                {t(`tabs.${k}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            {full ? t("capReached", { max: cap }) : t("count", { count: ofKind.length, max: cap })}
          </p>
          <Button type="button" size="sm" disabled={full} onClick={() => setAdding(true)}>
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
            icon={<Icons.sparkles aria-hidden />}
          />
        ) : null}
        {ofKind.length > 0 ? (
          <SortableList
            items={shown}
            label={t(`tabs.${kind}`)}
            handleLabel={t("dragHandle", { title: t(`tabs.${kind}`) })}
            onReorder={(next) => {
              setOrder(next)
              reorder.mutate(
                next.map((i) => i.id),
                { onSettled: () => setOrder(null) },
              )
            }}
            renderItem={(item) => <ItemCard item={item} />}
          />
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

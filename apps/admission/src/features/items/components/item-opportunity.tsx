"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { NotInList } from "../../opportunities/components/not-in-list"
import { useItemOpportunity, useLinkItemOpportunity, useUnlinkItemOpportunity, type Item } from "../api"

const BADGE = { verified: "success", pending: "warning", rejected: "secondary" } as const

/** The opportunity behind an activity: current catalog data with a pending or verified badge. */
export function ItemOpportunity({ item }: { item: Item }) {
  const t = useT("opportunities")
  const errorMessage = useErrorMessage()
  const link = useItemOpportunity(item.id)
  const save = useLinkItemOpportunity(item.id)
  const unlink = useUnlinkItemOpportunity(item.id)
  const [open, setOpen] = useState(false)
  const current = link.data

  async function run(body: Parameters<typeof save.mutateAsync>[0]) {
    try {
      await save.mutateAsync(body)
      toast.success(t("notInList.linked"))
      setOpen(false)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function remove() {
    try {
      await unlink.mutateAsync()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <section aria-label={t("notInList.linkTitle")} className="flex flex-col gap-2">
      {current ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">
            {current.opportunity.url ? (
              <a href={current.opportunity.url} target="_blank" rel="noreferrer" className="hover:underline">
                {current.opportunity.title}
              </a>
            ) : (
              current.opportunity.title
            )}
          </span>
          {current.opportunity.provider && (
            <span className="text-muted-foreground">{current.opportunity.provider}</span>
          )}
          <Badge variant={BADGE[current.status]}>{t(`notInList.status.${current.status}`)}</Badge>
          {current.reason && <span className="text-muted-foreground text-xs">{current.reason}</span>}
          <Button type="button" size="sm" variant="ghost" disabled={unlink.isPending} onClick={() => void remove()}>
            {t("notInList.unlink")}
          </Button>
        </div>
      ) : (
        !open && (
          <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => setOpen(true)}>
            {t("notInList.open")}
          </Button>
        )
      )}
      {open && !current && (
        <NotInList
          busy={save.isPending}
          onPick={(id) => void run({ opportunity_id: id })}
          onPropose={(draft) => void run({ draft })}
        />
      )}
    </section>
  )
}

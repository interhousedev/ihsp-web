"use client"

import type { LinkItem } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, ConfirmDialog, PageContainer, StateView } from "@ihsp/ui"
import { IconPlus } from "@ihsp/ui"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useState } from "react"
import { toast } from "sonner"
import { useDeleteLink, useMyLinks, useRevokeLink } from "../hooks/use-my-links"
import { KIND_FILTERS, linkName } from "../utils/link-display"
import { KindFilter } from "./kind-filter"
import { LinkRow } from "./link-row"
import { NewLinkDialog } from "./new-link-dialog"

type PendingAction = { type: "revoke" | "delete"; link: LinkItem }

/** `/links/`: every short link and share of the student, filtered by kind (WEB-26, SL-7, SHR-6). */
export function LinksPage() {
  const t = useT("links.page")
  const [kind, setKind] = useQueryState("kind", parseAsStringLiteral(KIND_FILTERS).withDefault("all"))
  const links = useMyLinks(kind)
  const revoke = useRevokeLink()
  const remove = useDeleteLink()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [action, setAction] = useState<PendingAction | null>(null)

  const items = links.data?.pages.flatMap((page) => page.items) ?? []

  function confirm() {
    if (!action) return
    const mutation = action.type === "revoke" ? revoke : remove
    mutation.mutate(action.link.id, {
      onSuccess: () => {
        toast.success(t(action.type === "revoke" ? "revoked" : "deleted"))
        setAction(null)
      },
      onError: () => toast.error(t("actionFailed")),
    })
  }

  const newButton = (
    <Button type="button" className="min-h-11" onClick={() => setDialogOpen(true)}>
      <IconPlus aria-hidden />
      {t("new")}
    </Button>
  )

  return (
    <PageContainer title={t("title")} description={t("description")} actions={newButton}>
      <KindFilter value={kind} onChange={(value) => void setKind(value)} />
      {links.isPending ? <StateView state="loading" rows={3} /> : null}
      {links.isError ? <StateView state="error" error={links.error} onRetry={() => void links.refetch()} /> : null}
      {links.isSuccess && items.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} action={newButton} />
      ) : null}
      {items.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((link) => (
            <li key={link.id}>
              <LinkRow
                link={link}
                onRevoke={(item) => setAction({ type: "revoke", link: item })}
                onDelete={(item) => setAction({ type: "delete", link: item })}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {links.hasNextPage ? (
        <div>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={links.isFetchingNextPage}
            onClick={() => void links.fetchNextPage()}
          >
            {t("loadMore")}
          </Button>
        </div>
      ) : null}
      <NewLinkDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
        title={action?.type === "revoke" ? t("revokeTitle") : t("deleteTitle")}
        description={
          action
            ? t(action.type === "revoke" ? "revokeDescription" : "deleteDescription", { name: linkName(action.link) })
            : undefined
        }
        confirmLabel={action?.type === "revoke" ? t("revokeConfirm") : t("deleteConfirm")}
        destructive
        loading={revoke.isPending || remove.isPending}
        onConfirm={confirm}
      />
    </PageContainer>
  )
}

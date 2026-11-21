"use client"

import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog, Icons, Skeleton, StateView } from "@ihsp/ui"
import { useState } from "react"
import { toast } from "sonner"
import { AppPageHeader, pageClass } from "../../../components/lib/page"
import { CASELOAD_ROLES } from "../../../config/nav"
import { AdmissionShell } from "../../shell/components/admission-shell"
import { QueryError } from "../../shell/components/query-error"
import { useDeleteKbArticle, useKbArticles, type KbArticle } from "../api"
import { ArticleFormDialog } from "./article-form-dialog"

function ArticleRow({
  article,
  canEdit,
  onEdit,
  onDelete,
}: {
  article: KbArticle
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const t = useT("kb.staff")
  return (
    <li className="bg-card rounded-card flex flex-wrap items-center gap-3 border p-4">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-medium">{article.title}</span>
        <span className="text-muted-foreground truncate text-xs">{article.tags.join(", ")}</span>
      </div>
      <Badge variant="outline">{article.locale.toUpperCase()}</Badge>
      <Badge variant={article.status === "published" ? "default" : "secondary"}>
        {article.status === "published" ? t("published") : t("draft")}
      </Badge>
      {canEdit ? (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            <Icons.edit aria-hidden />
            {t("edit")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDelete}>
            <Icons.trash aria-hidden />
            {t("delete")}
          </Button>
        </div>
      ) : null}
    </li>
  )
}

export function StaffKbPage() {
  const t = useT("kb.staff")
  const errorMessage = useErrorMessage()
  const query = useKbArticles({})
  const remove = useDeleteKbArticle()
  const [editing, setEditing] = useState<KbArticle | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<KbArticle | null>(null)
  const canEdit = query.data?.can_edit ?? false

  let body
  if (query.isPending) body = <Skeleton className="h-40 w-full" />
  else if (query.isError) body = <QueryError error={query.error} onRetry={() => void query.refetch()} />
  else if (query.data.items.length === 0) body = <StateView state="empty" title={t("empty")} />
  else
    body = (
      <ul className="flex flex-col gap-3">
        {query.data.items.map((article) => (
          <ArticleRow
            key={article.id}
            article={article}
            canEdit={canEdit}
            onEdit={() => {
              setEditing(article)
              setFormOpen(true)
            }}
            onDelete={() => setDeleting(article)}
          />
        ))}
      </ul>
    )

  return (
    <AdmissionShell roles={[...CASELOAD_ROLES]}>
      <div className={pageClass()}>
        <AppPageHeader icon="help" title={t("title")} />
        {query.data && !canEdit ? <p className="text-muted-foreground text-sm">{t("readOnly")}</p> : null}
        {canEdit ? (
          <Button
            type="button"
            className="self-start"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Icons.add aria-hidden />
            {t("new")}
          </Button>
        ) : null}
        {body}
      </div>
      <ArticleFormDialog open={formOpen} article={editing} onOpenChange={setFormOpen} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t("confirmDelete", { title: deleting.title }) : ""}
        confirmLabel={t("delete")}
        destructive
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleting) return
          remove.mutate(deleting.id, {
            onSuccess: () => {
              toast.success(t("deleted"))
              setDeleting(null)
            },
            onError: (error) => toast.error(errorMessage(error)),
          })
        }}
      />
    </AdmissionShell>
  )
}

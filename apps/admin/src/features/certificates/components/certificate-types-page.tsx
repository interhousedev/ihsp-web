"use client"

import { deleteCertificateType, getCertificateTypesQuery, keys, type CertificateType } from "@ihsp/api"
import { typeName } from "@ihsp/features-core"
import { useLocale, useT } from "@ihsp/i18n"
import {
  Badge,
  Button,
  ConfirmDialog,
  IconPencil,
  IconPlus,
  IconTrash,
  PageContainer,
  StateView,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { CertificateTypeDialog } from "./certificate-type-dialog"

/** The labels of the type's custom fields, in the active locale. */
function fieldLabels(type: CertificateType, locale: string): string {
  return type.custom_fields.map((field) => field.label[locale as "uz"] || field.label.en || field.key).join(", ")
}

/** Certificate types: create, edit and delete; built-in types cannot be deleted. */
export function CertificateTypesPage() {
  const t = useT("certificates.types")
  const tRoot = useT("certificates")
  const locale = useLocale()
  const types = useQuery(getCertificateTypesQuery())
  const [editing, setEditing] = useState<CertificateType | "new" | null>(null)
  const [deleting, setDeleting] = useState<CertificateType | null>(null)
  const remove = useAdminMutation({
    mutationFn: (type: CertificateType) => deleteCertificateType(type.id),
    invalidate: [keys.certificates.all()],
    success: t("deleted"),
    onSuccess: () => setDeleting(null),
  })
  return (
    <PageContainer
      title={tRoot("typesTitle")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setEditing("new")}>
          <IconPlus aria-hidden /> {t("add")}
        </Button>
      }
    >
      {types.isPending ? (
        <StateView state="loading" />
      ) : types.isError ? (
        <StateView state="error" error={types.error} onRetry={() => void types.refetch()} />
      ) : types.data.length === 0 ? (
        <StateView state="empty" emptyText={t("empty")} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.name")}</TableHead>
                <TableHead>{t("columns.code")}</TableHead>
                <TableHead>{t("columns.asks")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("columns.actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.data.map((type) => {
                const name = typeName(type, locale)
                return (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">
                      {name} {type.builtin ? <Badge variant="secondary">{t("builtin")}</Badge> : null}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{type.code}</TableCell>
                    <TableCell>{fieldLabels(type, locale)}</TableCell>
                    <TableCell>
                      <span className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={TOUCH_ICON}
                          aria-label={t("edit", { name })}
                          onClick={() => setEditing(type)}
                        >
                          <IconPencil aria-hidden />
                        </Button>
                        <span title={type.builtin ? t("builtinTooltip") : undefined}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={TOUCH_ICON}
                            aria-label={t("delete", { name })}
                            disabled={type.builtin}
                            onClick={() => setDeleting(type)}
                          >
                            <IconTrash aria-hidden />
                          </Button>
                        </span>
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
      {editing ? (
        <CertificateTypeDialog
          key={editing === "new" ? "new" : editing.id}
          type={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (open ? undefined : setDeleting(null))}
          title={t("deleteTitle", { name: typeName(deleting, locale) })}
          description={t("deleteText")}
          confirmLabel={t("confirmDelete")}
          destructive
          loading={remove.isPending}
          onConfirm={() => remove.mutate(deleting)}
        />
      ) : null}
    </PageContainer>
  )
}

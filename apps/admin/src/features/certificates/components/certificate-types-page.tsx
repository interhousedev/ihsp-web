"use client"

import { deleteCertificateType, getCertificateTypesQuery, keys, type CertificateType } from "@ihsp/api"
import { typeName } from "@ihsp/features-core"
import { useLocale, useT } from "@ihsp/i18n"
import { Badge, Button, ConfirmDialog, IconPencil, IconPlus, IconTrash, PageContainer } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { PagedTable } from "../../shared/components/paged-table"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { useArrayList } from "../../shared/hooks/use-paged-list"
import { actionsCol, col } from "../../shared/utils/columns"
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
  const source = useArrayList<CertificateType>({
    data: types.data,
    isPending: types.isPending,
    isError: types.isError,
    error: types.error,
    refetch: () => types.refetch(),
  })
  const [editing, setEditing] = useState<CertificateType | "new" | null>(null)
  const [deleting, setDeleting] = useState<CertificateType | null>(null)
  const remove = useAdminMutation({
    mutationFn: (type: CertificateType) => deleteCertificateType(type.id),
    invalidate: [keys.certificates.all()],
    success: t("deleted"),
    onSuccess: () => setDeleting(null),
  })
  const columns = useMemo(
    () => [
      col<CertificateType>("name", t("columns.name"), (type) => (
        <span className="font-medium">
          {typeName(type, locale)} {type.builtin ? <Badge variant="secondary">{t("builtin")}</Badge> : null}
        </span>
      )),
      col<CertificateType>("code", t("columns.code"), (type) => <span className="font-mono text-xs">{type.code}</span>),
      col<CertificateType>("asks", t("columns.asks"), (type) => fieldLabels(type, locale)),
      actionsCol<CertificateType>(t("columns.actions"), (type) => {
        const name = typeName(type, locale)
        return (
          <>
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
          </>
        )
      }),
    ],
    [t, locale],
  )
  return (
    <PageContainer
      title={tRoot("typesTitle")}
      actions={
        <Button type="button" className={TOUCH} onClick={() => setEditing("new")}>
          <IconPlus aria-hidden /> {t("add")}
        </Button>
      }
    >
      <PagedTable source={source} columns={columns} getRowId={(type) => type.id} emptyText={t("empty")} cardLayout />
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

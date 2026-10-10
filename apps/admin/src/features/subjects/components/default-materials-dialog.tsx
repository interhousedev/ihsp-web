"use client"

import {
  deleteAdminSubjectMaterial,
  getAdminSubjectMaterialsQuery,
  keys,
  type SubjectMaterial,
  type SubjectMaterialKind,
} from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Icons } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH, TOUCH_ICON } from "../../shared/utils/touch"
import { DefaultMaterialForm } from "./default-material-form"

function MaterialsBody({ eduSubjectId }: { eduSubjectId: number }) {
  const t = useT("subjects.materials")
  const errorMessage = useErrorMessage()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const list = useQuery(getAdminSubjectMaterialsQuery(eduSubjectId))

  const remove = useAdminMutation({
    mutationFn: (material: SubjectMaterial) => deleteAdminSubjectMaterial(eduSubjectId, material.id),
    invalidate: [keys.admin.subjectMaterials.all()],
    success: t("removed"),
    inlineError: true,
    onSuccess: () => setConfirmId(null),
  })

  const kindLabels: Record<SubjectMaterialKind, string> = {
    file: t("kind.file"),
    link: t("kind.link"),
    library_item: t("kind.library_item"),
  }

  return (
    <>
      <QueryState query={list} rows={2}>
        {(materials) =>
          materials.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("empty")}</p>
          ) : (
            <ol aria-label={t("listLabel")} className="flex flex-col gap-2">
              {materials.map((material) => (
                <li key={material.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-medium break-words">{material.title}</span>
                    <span className="flex min-w-0 items-center gap-2 text-xs">
                      <Badge variant="secondary">{kindLabels[material.kind]}</Badge>
                      {material.url ? (
                        <span className="text-muted-foreground min-w-0 truncate" title={material.url}>
                          {material.url}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  {confirmId === material.id ? (
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                      <span className="text-sm">{t("removeAsk")}</span>
                      <Button
                        type="button"
                        variant="destructive"
                        className={TOUCH}
                        disabled={remove.isPending}
                        aria-label={t("removeConfirmFor", { title: material.title })}
                        onClick={() => remove.mutate(material)}
                      >
                        {t("removeConfirm")}
                      </Button>
                      <Button type="button" variant="outline" className={TOUCH} onClick={() => setConfirmId(null)}>
                        {t("keep")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={`${TOUCH_ICON} shrink-0`}
                      aria-label={t("remove", { title: material.title })}
                      onClick={() => {
                        remove.reset()
                        setConfirmId(material.id)
                      }}
                    >
                      <Icons.trash aria-hidden />
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          )
        }
      </QueryState>
      {remove.isError ? (
        <p role="alert" className="text-destructive text-sm">
          {errorMessage(remove.error)}
        </p>
      ) : null}
      <DefaultMaterialForm eduSubjectId={eduSubjectId} />
    </>
  )
}

/**
 * The default materials of one EMIS subject id: the list with a remove button for each, and the "Add material" form.
 * Every student's notebook of the subject gets a copy. `label` is the subject name; without it the EMIS id is the title.
 */
export function DefaultMaterialsDialog({
  eduSubjectId,
  label,
  open,
  onOpenChange,
}: {
  eduSubjectId: number | null
  label?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const t = useT("subjects.materials")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {eduSubjectId !== null ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("title", { label: label ?? t("emisLabel", { id: eduSubjectId }) })}</DialogTitle>
              <DialogDescription>{t("description", { id: eduSubjectId })}</DialogDescription>
            </DialogHeader>
            <MaterialsBody key={eduSubjectId} eduSubjectId={eduSubjectId} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

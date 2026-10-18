"use client"

import {
  keys,
  patchMyCertificate,
  postMyCertificate,
  type CertificateEntry,
  type CertificateEntryInput,
  type CertificateType,
  type CustomValue,
} from "@ihsp/api"
import { CustomFieldInputs, typeName } from "@ihsp/features-core"
import { useErrorMessage, useLocale, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

/** Form of one certificate entry: the custom fields of its type. */
export function CertificateEntryDialog({
  type,
  entry,
  onClose,
}: {
  type: CertificateType
  entry: CertificateEntry | null
  onClose: () => void
}) {
  const t = useT("certificates")
  const locale = useLocale()
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [custom, setCustom] = useState<Record<string, CustomValue>>(entry?.custom_values ?? {})
  const name = typeName(type, locale)

  const save = useMutation({
    mutationFn: (body: CertificateEntryInput) => (entry ? patchMyCertificate(entry.id, body) : postMyCertificate(body)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.certificates.mine() })
      toast.success(t("saved"))
      onClose()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  const valid = type.custom_fields.every((field) => !field.required || custom[field.key] !== undefined)
  const submit = () =>
    save.mutate({
      type_id: type.id,
      custom: type.custom_fields.length > 0 ? custom : null,
    })

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>{entry ? t("editEntry", { type: name }) : t("addEntry", { type: name })}</DialogTitle>
          </DialogHeader>
          <CustomFieldInputs fields={type.custom_fields} values={custom} onChange={setCustom} />
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-11 md:min-h-8" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="min-h-11 md:min-h-8" disabled={!valid || save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

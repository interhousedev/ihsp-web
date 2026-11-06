"use client"

import { keys, patchAdminKnowledge, postAdminKnowledge, type KnowledgeEntry } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Checkbox, ResponsiveDialog, Input, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { parseTags } from "../utils"

type Draft = {
  key: string
  title: string | null
  value: string
  tags: string[]
  accessible_to_guest: boolean
  accessible_to_student: boolean
}

/** Create or edit a knowledge entry (`entry` is null for a new one); a taken key is shown under the key field. */
export function KnowledgeDialog({ entry, onClose }: { entry: KnowledgeEntry | null; onClose: () => void }) {
  const t = useT("knowledge")
  const errorMessage = useErrorMessage()
  const [key, setKey] = useState(entry?.key ?? "")
  const [title, setTitle] = useState(entry?.title ?? "")
  const [value, setValue] = useState(entry?.value ?? "")
  const [tags, setTags] = useState((entry?.tags ?? []).join(", "))
  const [guest, setGuest] = useState(entry?.accessible_to_guest ?? false)
  const [student, setStudent] = useState(entry?.accessible_to_student ?? true)
  const save = useAdminMutation({
    mutationFn: (body: Draft) => (entry ? patchAdminKnowledge(entry.id, body) : postAdminKnowledge(body)),
    invalidate: [keys.admin.knowledge.all()],
    success: entry ? t("updated") : t("created"),
    onSuccess: onClose,
    inlineError: true,
  })
  const valid = key.trim() !== "" && value.trim() !== ""
  const submit = () =>
    save.mutate({
      key: key.trim(),
      title: title.trim() || null,
      value: value.trim(),
      tags: parseTags(tags),
      accessible_to_guest: guest,
      accessible_to_student: student,
    })
  return (
    <ResponsiveDialog
      open
      onOpenChange={(open) => (open ? undefined : onClose())}
      size="md"
      title={entry ? t("edit", { key: entry.key }) : t("add")}
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) submit()
      }}
      footer={
        <>
          <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" className={TOUCH} disabled={!valid || save.isPending}>
            {t("save")}
          </Button>
        </>
      }
    >
      <>
        <LabeledField label={t("fields.key")} htmlFor="knowledge-key" required>
          <Input
            id="knowledge-key"
            className={TOUCH}
            maxLength={80}
            value={key}
            aria-invalid={save.isError}
            onChange={(e) => setKey(e.target.value)}
          />
          {save.isError ? (
            <p role="alert" className="text-destructive text-sm">
              {errorMessage(save.error)}
            </p>
          ) : null}
        </LabeledField>
        <LabeledField label={t("fields.title")} htmlFor="knowledge-title">
          <Input
            id="knowledge-title"
            className={TOUCH}
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </LabeledField>
        <LabeledField label={t("fields.value")} htmlFor="knowledge-value" required>
          <Textarea
            id="knowledge-value"
            rows={8}
            maxLength={20000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </LabeledField>
        <LabeledField label={t("fields.tags")} htmlFor="knowledge-tags" description={t("tagsHint")}>
          <Input id="knowledge-tags" className={TOUCH} value={tags} onChange={(e) => setTags(e.target.value)} />
        </LabeledField>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={guest} onCheckedChange={(c) => setGuest(c === true)} />
          {t("accessGuest")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={student} onCheckedChange={(c) => setStudent(c === true)} />
          {t("accessStudent")}
        </label>
      </>
    </ResponsiveDialog>
  )
}

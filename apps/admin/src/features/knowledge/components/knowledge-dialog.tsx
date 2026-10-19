"use client"

import { keys, patchAdminKnowledge, postAdminKnowledge, type KnowledgeEntry } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Textarea } from "@ihsp/ui"
import { useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { parseTags } from "../utils"

type Draft = { key: string; title: string | null; value: string; tags: string[] }

/** Create or edit a knowledge entry (`entry` is null for a new one); a taken key is shown under the key field. */
export function KnowledgeDialog({ entry, onClose }: { entry: KnowledgeEntry | null; onClose: () => void }) {
  const t = useT("knowledge")
  const errorMessage = useErrorMessage()
  const [key, setKey] = useState(entry?.key ?? "")
  const [title, setTitle] = useState(entry?.title ?? "")
  const [value, setValue] = useState(entry?.value ?? "")
  const [tags, setTags] = useState((entry?.tags ?? []).join(", "))
  const save = useAdminMutation({
    mutationFn: (body: Draft) => (entry ? patchAdminKnowledge(entry.id, body) : postAdminKnowledge(body)),
    invalidate: [keys.admin.knowledge.all()],
    success: entry ? t("updated") : t("created"),
    onSuccess: onClose,
    inlineError: true,
  })
  const valid = key.trim() !== "" && value.trim() !== ""
  const submit = () =>
    save.mutate({ key: key.trim(), title: title.trim() || null, value: value.trim(), tags: parseTags(tags) })
  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-lg">
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) submit()
          }}
        >
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle>{entry ? t("edit", { key: entry.key }) : t("add")}</DialogTitle>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto p-4">
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
          </div>
          <DialogFooter className="border-t p-4">
            <Button type="button" variant="outline" className={TOUCH} onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!valid || save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

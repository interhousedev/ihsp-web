"use client"

import { getAdminGroupsQuery, postAdminLoginCuesBulk } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Textarea } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { LabeledField } from "../../shared/components/labeled-field"
import { SelectField } from "../../shared/components/select-field"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"
import { parseBulkLines } from "../utils/parse-bulk"

/** Pastes many cues at once: one `login;full name` per line, all for the chosen group. */
export function LoginCueBulkDialog({
  open,
  onOpenChange,
  defaultGroupId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultGroupId: string
}) {
  const t = useT("loginCues")
  const groups = useQuery(getAdminGroupsQuery())
  const [groupId, setGroupId] = useState(defaultGroupId)
  const [text, setText] = useState("")
  const parsed = useMemo(() => parseBulkLines(text), [text])
  const valid = groupId !== "" && parsed.items.length > 0 && parsed.errors.length === 0

  const upload = useAdminMutation({
    mutationFn: () => postAdminLoginCuesBulk({ items: parsed.items.map((item) => ({ ...item, group_id: groupId })) }),
    invalidate: [["admin", "login-cues"]],
    success: (data) => t("bulk.done", { count: data.created.length }),
    onSuccess: () => {
      setText("")
      onOpenChange(false)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (valid) upload.mutate()
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("bulk.title")}</DialogTitle>
          </DialogHeader>
          <LabeledField label={t("form.group")} htmlFor="login-cue-bulk-group" required>
            <SelectField
              id="login-cue-bulk-group"
              value={groupId}
              emptyLabel={t("form.chooseGroup")}
              options={(groups.data ?? []).map((group) => ({ value: group.id, label: group.name }))}
              onChange={setGroupId}
            />
          </LabeledField>
          <LabeledField label={t("bulk.lines")} htmlFor="login-cue-bulk-lines" description={t("bulk.hint")} required>
            <Textarea
              id="login-cue-bulk-lines"
              rows={8}
              className="font-mono text-sm"
              placeholder={t("bulk.placeholder")}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          </LabeledField>
          {text.trim() !== "" ? (
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {t("bulk.preview", { count: parsed.items.length })}
              {parsed.errors.length > 0
                ? ` ${t("bulk.errors", { lines: parsed.errors.map((error) => error.line).join(", ") })}`
                : null}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" className={TOUCH} disabled={!valid || upload.isPending}>
              {t("bulk.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

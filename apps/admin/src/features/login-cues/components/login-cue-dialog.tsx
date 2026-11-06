"use client"

import { getAdminGroupsQuery, postAdminLoginCue } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, useAppForm, ResponsiveDialog } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

type Values = { full_name: string; group_id: string; emis_login: string }

/** Adds one login cue: the full name, the group and the EMIS login (digits only). */
export function LoginCueDialog({
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
  const schema = useMemo(
    () =>
      z.object({
        full_name: z.string().trim().min(1, t("form.required")),
        group_id: z.string().min(1, t("form.required")),
        emis_login: z.string().trim().regex(/^\d+$/, t("form.loginDigits")).max(32, t("form.loginDigits")),
      }),
    [t],
  )
  const create = useAdminMutation({
    mutationFn: (values: Values) =>
      postAdminLoginCue({
        full_name: values.full_name.trim(),
        group_id: values.group_id,
        emis_login: values.emis_login.trim(),
      }),
    invalidate: [["admin", "login-cues"]],
    success: t("created"),
    onSuccess: () => onOpenChange(false),
  })
  const form = useAppForm({
    defaultValues: { full_name: "", group_id: defaultGroupId, emis_login: "" } as Values,
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => create.mutate(value),
  })

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      noValidate
      title={t("form.title")}
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
      footer={
        <>
          <Button type="button" variant="outline" className={TOUCH} onClick={() => onOpenChange(false)}>
            {t("form.cancel")}
          </Button>
          <Button type="submit" className={TOUCH} disabled={create.isPending}>
            {t("form.submit")}
          </Button>
        </>
      }
    >
      <form.AppField name="full_name">
        {(field) => <field.TextField label={t("form.fullName")} required autoComplete="off" className={TOUCH} />}
      </form.AppField>
      <form.AppField name="group_id">
        {(field) => (
          <field.SelectField
            label={t("form.group")}
            required
            placeholder={t("form.chooseGroup")}
            options={(groups.data ?? []).map((group) => ({ value: group.id, label: group.name }))}
          />
        )}
      </form.AppField>
      <form.AppField name="emis_login">
        {(field) => (
          <field.TextField
            label={t("form.emisLogin")}
            description={t("form.emisLoginHint")}
            required
            inputMode="numeric"
            autoComplete="off"
            className={TOUCH}
          />
        )}
      </form.AppField>
    </ResponsiveDialog>
  )
}

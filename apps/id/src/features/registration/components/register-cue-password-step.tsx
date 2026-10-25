"use client"

import { postIdRegisterCue, type LoginCueName, type RegistrationStart } from "@ihsp/api"
import { Button, useAppForm } from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { FlowCard } from "../../shared/components/flow-card"
import { useTr } from "../../shared/hooks/use-tr"

type RegisterCuePasswordStepProps = {
  cue: LoginCueName
  onStarted: (start: RegistrationStart) => void
  onBack: () => void
}

/** "Pick your name", step 3: the EMIS password proves the picked name; the registration then continues as usual. */
export function RegisterCuePasswordStep({ cue, onStarted, onBack }: RegisterCuePasswordStepProps) {
  const t = useTr()
  const schema = useMemo(() => z.object({ emis_password: z.string().min(1, t("idCommon.validation.required")) }), [t])
  const start = useMutation({
    mutationFn: (emisPassword: string) => postIdRegisterCue({ cue_id: cue.cue_id, emis_password: emisPassword }),
    onSuccess: (result) => onStarted(result),
  })
  const form = useAppForm({
    defaultValues: { emis_password: "" },
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => start.mutate(value.emis_password),
  })

  return (
    <FlowCard title={t("register.cue.passwordTitle")} description={cue.display_name}>
      <form
        noValidate
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.AppField name="emis_password">
          {(field) => (
            <field.TextField
              label={t("register.cue.emisPassword")}
              type="password"
              autoComplete="off"
              className="h-11 text-base"
            />
          )}
        </form.AppField>
        <ErrorAlert error={start.error} />
        <Button type="submit" className="h-11 text-base" disabled={start.isPending}>
          {t("register.cue.submit")}
        </Button>
      </form>
      <Button type="button" variant="outline" className="h-11 text-base" onClick={onBack}>
        {t("register.cue.back")}
      </Button>
    </FlowCard>
  )
}

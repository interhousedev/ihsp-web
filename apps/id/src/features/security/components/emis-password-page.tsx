"use client"

import { getIdMeQuery, keys, postEmisPassword } from "@ihsp/api"
import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingButton,
  PageContainer,
  useAppForm,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"
import { ErrorAlert } from "../../shared/components/error-alert"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { EmisReauthBanner } from "./emis-reauth-banner"

/** `/security/emis/` (UF-ID-12, ID-8): the new EMIS password is checked against EMIS before it replaces the saved one. */
export function EmisPasswordPage() {
  const t = useTr()
  const me = useQuery(getIdMeQuery())
  const queryClient = useQueryClient()
  const schema = useMemo(() => z.object({ password: z.string().min(1, t("idCommon.validation.required")) }), [t])
  const mutation = useMutation({
    mutationFn: (password: string) => postEmisPassword({ emis_password: password }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.id.me() }),
  })
  const form = useAppForm({
    defaultValues: { password: "" },
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      const done = await mutation.mutateAsync(value.password).then(
        () => true,
        () => false,
      )
      if (done) formApi.reset()
    },
  })

  return (
    <PageContainer title={t("security.emis.title")} description={t("security.emis.description")}>
      <QueryBoundary query={me}>
        {(user) => (
          <div className="grid gap-4">
            {user.emis_status === "needs_reauth" ? <EmisReauthBanner /> : null}
            <Card>
              <CardHeader>
                <CardTitle>{t("security.emis.formTitle")}</CardTitle>
                <CardDescription>{t("security.emis.formDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  noValidate
                  className="grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    mutation.reset()
                    void form.handleSubmit()
                  }}
                >
                  <form.AppField name="password">
                    {(field) => (
                      <field.TextField
                        label={t("idCommon.emisPassword")}
                        type="password"
                        autoComplete="off"
                        className="h-11 text-base"
                      />
                    )}
                  </form.AppField>
                  <ErrorAlert error={mutation.error} />
                  {mutation.isSuccess ? (
                    <Alert role="status">
                      <AlertDescription>{t("security.emis.done")}</AlertDescription>
                    </Alert>
                  ) : null}
                  <LoadingButton
                    type="submit"
                    className="h-11 text-base"
                    loading={mutation.isPending}
                    loadingLabel={t("idCommon.working")}
                  >
                    {t("security.emis.submit")}
                  </LoadingButton>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </QueryBoundary>
    </PageContainer>
  )
}

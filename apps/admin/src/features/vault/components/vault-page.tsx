"use client"

import { ApiError, getAdminVaultStatusQuery, keys, postAdminVaultUnseal } from "@ihsp/api"
import { QueryState } from "@ihsp/features-core"
import { useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FieldLabel,
  Input,
  LoadingButton,
  PageContainer,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useRef } from "react"

const ERROR_KEYS: Record<string, string> = {
  "id/vault-key-rejected": "errors.rejected",
  "id/vault-unavailable": "errors.unavailable",
}

/** Vault: seal state and key-share progress; one key share is sent per submit and never kept. */
export function VaultPage() {
  const t = useT("vault")
  const status = useQuery(getAdminVaultStatusQuery())
  const queryClient = useQueryClient()
  const keyId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const unseal = useMutation({
    mutationFn: (body: { key: string }) => postAdminVaultUnseal(body),
    onSuccess: (next) => queryClient.setQueryData(keys.admin.vaultStatus(), next),
  })

  function submit(form: HTMLFormElement) {
    const data = new FormData(form)
    const key = String(data.get("key") ?? "")
    form.reset()
    if (key === "") return
    unseal.mutate({ key })
  }

  const errorKey = unseal.error instanceof ApiError ? ERROR_KEYS[unseal.error.type] : undefined

  return (
    <PageContainer title={t("title")}>
      <QueryState query={status} rows={2}>
        {(data) => (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {t("status")}
                <Badge variant={data.sealed ? "destructive" : "secondary"}>
                  {data.sealed ? t("sealed") : t("unsealed")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p data-testid="vault-progress" className="text-sm">
                {t("progress", { progress: data.progress, threshold: data.threshold })}
              </p>
            </CardContent>
          </Card>
        )}
      </QueryState>
      <Card>
        <CardHeader>
          <CardTitle>{t("form.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            ref={formRef}
            noValidate
            autoComplete="off"
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              submit(event.currentTarget)
            }}
          >
            <div className="grid gap-2">
              <FieldLabel htmlFor={keyId}>{t("form.key")}</FieldLabel>
              <Input id={keyId} name="key" type="password" autoComplete="off" spellCheck={false} />
            </div>
            {unseal.error ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{errorKey ? t(errorKey) : t("errors.generic")}</AlertDescription>
              </Alert>
            ) : null}
            <LoadingButton type="submit" loading={unseal.isPending} loadingLabel={t("form.sending")}>
              {t("form.submit")}
            </LoadingButton>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}

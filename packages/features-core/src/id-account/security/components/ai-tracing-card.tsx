"use client"

import { patchPreferences, type UserMe } from "@ihsp/api"
import { Card, CardContent, CardHeader, CardTitle, Label, Switch } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { applyPreferences } from "../../../notification-settings-form/use-update-preferences"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

/** "Block unnecessary tracking and analytics": `preferences.limit_ai_tracing`, saved at once. */
export function AiTracingCard({ user }: { user: UserMe }) {
  const t = useTr()
  const queryClient = useQueryClient()
  const [on, setOn] = useState(user.preferences.limit_ai_tracing)
  const save = useMutation({
    mutationFn: (value: boolean) => patchPreferences({ limit_ai_tracing: value }),
    onMutate: (value) => setOn(value),
    onError: (_error, value) => setOn(!value),
    onSuccess: (preferences) => applyPreferences(preferences, queryClient),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("security.tracing.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex min-h-11 items-start justify-between gap-4">
          <Label htmlFor="limit-ai-tracing" className="grid gap-0.5 font-normal">
            <span className="font-medium">{t("security.tracing.label")}</span>
            <span className="text-muted-foreground text-xs">{t("security.tracing.description")}</span>
          </Label>
          <Switch
            id="limit-ai-tracing"
            checked={on}
            disabled={save.isPending}
            onCheckedChange={(value) => save.mutate(value)}
          />
        </div>
        <ErrorAlert error={save.error} />
      </CardContent>
    </Card>
  )
}

"use client"

import type { PersonalTokenCreated } from "@ihsp/api"
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CopyButton,
} from "@ihsp/ui"
import { useTr } from "../../shared/hooks/use-tr"

/** The secret of a new personal token: shown once, with Copy; the list never shows it again. */
export function PersonalTokenSecret({ created, onDone }: { created: PersonalTokenCreated; onDone: () => void }) {
  const t = useTr()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("personalTokens.created.title", { name: created.personal_token.name })}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Alert role="status">
          <AlertTitle>{t("personalTokens.created.onceTitle")}</AlertTitle>
          <AlertDescription>{t("personalTokens.created.once")}</AlertDescription>
        </Alert>
        <div className="grid gap-2">
          <code data-testid="personal-token-secret" className="bg-muted rounded-lg p-3 text-sm break-all">
            {created.token}
          </code>
          <CopyButton value={created.token} label={t("personalTokens.created.copy")} />
        </div>
        <Button type="button" className="h-11 text-base" onClick={onDone}>
          {t("personalTokens.created.done")}
        </Button>
      </CardContent>
    </Card>
  )
}

"use client"

import { getIdPersonalTokensQuery, keys, type PersonalTokenCreated } from "@ihsp/api"
import { Button, PageContainer, StateView } from "@ihsp/ui"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { useTr } from "../../shared/hooks/use-tr"
import { NewPersonalTokenForm } from "./new-personal-token-form"
import { PersonalTokenCard } from "./personal-token-card"
import { PersonalTokenSecret } from "./personal-token-secret"

type View = { kind: "list" } | { kind: "form" } | { kind: "secret"; created: PersonalTokenCreated }

/** `/personal-tokens/`: tokens for scripts, newest first; the secret of a new one is shown once. */
export function PersonalTokensPage() {
  const t = useTr()
  const query = useQuery(getIdPersonalTokensQuery())
  const queryClient = useQueryClient()
  const [view, setView] = useState<View>({ kind: "list" })
  const openForm = () => setView({ kind: "form" })

  return (
    <PageContainer
      title={t("personalTokens.title")}
      actions={
        view.kind === "list" ? (
          <Button type="button" onClick={openForm}>
            {t("personalTokens.new.action")}
          </Button>
        ) : null
      }
    >
      {view.kind === "secret" ? (
        <PersonalTokenSecret created={view.created} onDone={() => setView({ kind: "list" })} />
      ) : null}
      {view.kind === "form" ? (
        <NewPersonalTokenForm
          onCancel={() => setView({ kind: "list" })}
          onCreated={(created) => {
            void queryClient.invalidateQueries({ queryKey: keys.id.personalTokens() })
            setView({ kind: "secret", created })
          }}
        />
      ) : null}
      {view.kind === "list" ? (
        <QueryBoundary query={query}>
          {(tokens) =>
            tokens.length === 0 ? (
              <StateView
                state="empty"
                emptyText={t("personalTokens.empty")}
                action={
                  <Button type="button" onClick={openForm}>
                    {t("personalTokens.new.action")}
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-3">
                {tokens
                  .toSorted((a, b) => b.created_at.localeCompare(a.created_at))
                  .map((token) => (
                    <li key={token.id}>
                      <PersonalTokenCard token={token} />
                    </li>
                  ))}
              </ul>
            )
          }
        </QueryBoundary>
      ) : null}
    </PageContainer>
  )
}

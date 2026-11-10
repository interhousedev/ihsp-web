"use client"

import { getIdMeConnectorOffersQuery, keys, postIdMeConnectorOfferDecision, type ScopeOffer } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Card, CardContent } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

function ScopeList({ label, scopes }: { label: string; scopes: string[] }) {
  if (scopes.length === 0) return null
  return (
    <div className="grid gap-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <ul className="flex flex-wrap gap-1" aria-label={label}>
        {scopes.map((scope) => (
          <li key={scope}>
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">{scope}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OfferCard({ offer, onDecided }: { offer: ScopeOffer; onDecided: (message: string) => void }) {
  const t = useTr()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const decide = useMutation({
    mutationFn: (grant: boolean) => postIdMeConnectorOfferDecision(offer.id, { grant }),
    onSuccess: async (decision) => {
      onDecided(
        decision.result === "granted"
          ? t("connectors.offers.granted")
          : decision.result === "declined"
            ? t("connectors.offers.declined")
            : t("connectors.offers.gone"),
      )
      await queryClient.invalidateQueries({ queryKey: keys.id.connectors() })
    },
  })
  return (
    <Card>
      <CardContent className="grid gap-3">
        <span className="font-medium">{t("connectors.offers.title")}</span>
        <ScopeList label={t("connectors.offers.read")} scopes={offer.read_scopes} />
        <ScopeList label={t("connectors.offers.write")} scopes={offer.write_scopes} />
        <p className="text-muted-foreground text-sm break-words">
          {t("connectors.offers.forConnectors", { names: offer.connector_names.join(", ") })}
          <br />
          {t("connectors.offers.until", { date: format.dateTime(offer.expires_at) })}
        </p>
        <ErrorAlert error={decide.error} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="h-11" disabled={decide.isPending} onClick={() => decide.mutate(true)}>
            {t("connectors.offers.accept")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={decide.isPending}
            onClick={() => decide.mutate(false)}
          >
            {t("connectors.offers.decline")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/** A7: the same decision as the Telegram buttons, for people who have no Telegram. */
export function ScopeOffersSection() {
  const query = useQuery(getIdMeConnectorOffersQuery())
  const [message, setMessage] = useState<string | null>(null)
  const offers = query.data ?? []
  if (offers.length === 0 && message === null) return null
  return (
    <section className="mb-4 grid gap-3">
      {message !== null ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} onDecided={setMessage} />
      ))}
    </section>
  )
}

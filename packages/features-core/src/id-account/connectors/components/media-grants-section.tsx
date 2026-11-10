"use client"

import { deleteLmsMediaGrant, getLmsMediaGrants, keys, type MediaGrant } from "@ihsp/api"
import { useFormatters } from "@ihsp/i18n"
import { Badge, Button, Card, CardContent, ConfirmDialog } from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { useTr } from "../../shared/hooks/use-tr"

function GrantCard({ grant }: { grant: MediaGrant }) {
  const t = useTr()
  const format = useFormatters()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const stop = useMutation({
    mutationFn: () => deleteLmsMediaGrant(grant.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: keys.id.mediaGrants() })
      setConfirming(false)
    },
  })
  const stopped = grant.revoked_at !== null
  return (
    <Card>
      <CardContent className="flex flex-wrap items-start justify-between gap-3">
        <dl className="text-muted-foreground grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt>{t("connectors.media.issued")}</dt>
          <dd>{format.dateTime(grant.created_at)}</dd>
          <dt>{t("connectors.media.until")}</dt>
          <dd>{format.dateTime(grant.expires_at)}</dd>
          <dt>{t("connectors.media.opens")}</dt>
          <dd>{grant.redeem_count}</dd>
        </dl>
        {stopped ? (
          <Badge variant="destructive">{t("connectors.media.stopped")}</Badge>
        ) : (
          <Button type="button" variant="outline" className="h-11" onClick={() => setConfirming(true)}>
            {t("connectors.media.stop")}
          </Button>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={t("connectors.media.stopTitle")}
        description={t("connectors.media.stopDescription")}
        confirmLabel={t("connectors.media.stop")}
        destructive
        loading={stop.isPending}
        onConfirm={() => stop.mutate()}
      >
        <ErrorAlert error={stop.error} />
      </ConfirmDialog>
    </Card>
  )
}

/** MCP-B5: the media links issued for me; hidden until there is one. */
export function MediaGrantsSection() {
  const t = useTr()
  const query = useQuery({
    queryKey: keys.id.mediaGrants(),
    queryFn: ({ signal }) => getLmsMediaGrants({ signal }),
  })
  const items = query.data?.items ?? []
  if (items.length === 0) return null
  return (
    <section className="mt-6 grid gap-3">
      <h2 className="text-lg font-medium">{t("connectors.media.title")}</h2>
      <p className="text-muted-foreground text-sm">{t("connectors.media.hint")}</p>
      <ul className="grid gap-3">
        {items.map((grant) => (
          <li key={grant.id}>
            <GrantCard grant={grant} />
          </li>
        ))}
      </ul>
    </section>
  )
}

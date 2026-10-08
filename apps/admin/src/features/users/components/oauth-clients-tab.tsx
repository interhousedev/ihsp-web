"use client"

import { getAdminOauthClientsQuery, keys, postAdminOauthClientVerify, type OauthClientItem } from "@ihsp/api"
import { useFormatters, useT } from "@ihsp/i18n"
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { QueryState } from "../../shared/components/query-state"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"
import { TOUCH } from "../../shared/utils/touch"

function ClientRow({ client }: { client: OauthClientItem }) {
  const t = useT("users.clients")
  const f = useFormatters()
  const verify = useAdminMutation({
    mutationFn: (verified: boolean) => postAdminOauthClientVerify(client.client_id, { verified }),
    invalidate: [keys.admin.oauthClients()],
    success: (_data, verified) =>
      verified ? t("verifiedDone", { name: client.name }) : t("unverifiedDone", { name: client.name }),
  })
  return (
    <TableRow>
      <TableCell className="font-medium">{client.name}</TableCell>
      <TableCell className="font-mono text-xs break-all">{client.client_id}</TableCell>
      <TableCell>{client.dynamic ? t("dynamic") : t("builtIn")}</TableCell>
      <TableCell>{client.last_used_at ? f.dateTime(client.last_used_at) : "—"}</TableCell>
      <TableCell>
        <Badge variant={client.verified ? "secondary" : "outline"}>
          {client.verified ? t("verified") : t("unverified")}
        </Badge>
      </TableCell>
      <TableCell className="text-end">
        <Button
          type="button"
          variant="outline"
          className={TOUCH}
          disabled={verify.isPending}
          onClick={() => verify.mutate(!client.verified)}
        >
          {client.verified ? t("unverify") : t("verify")}
        </Button>
      </TableCell>
    </TableRow>
  )
}

/** OAuth clients and the "unverified" flag shown on the MCP consent screen (ID-20). */
export function OauthClientsTab() {
  const t = useT("users.clients")
  const query = useQuery(getAdminOauthClientsQuery())
  return (
    <QueryState query={query} isEmpty={(data) => data.length === 0} emptyText={t("empty")}>
      {(clients) => (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("clientId")}</TableHead>
                <TableHead>{t("kind")}</TableHead>
                <TableHead>{t("lastUsed")}</TableHead>
                <TableHead>{t("state")}</TableHead>
                <TableHead>
                  <span className="sr-only">{t("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <ClientRow key={client.client_id} client={client} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </QueryState>
  )
}

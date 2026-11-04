"use client"

import {
  deleteIdMeMcpClient,
  getIdMeMcpClientsQuery,
  getIdMeMcpSetupQuery,
  keys,
  postIdMeMcpClient,
  postIdMeMcpSetup,
  type ConnectorCreated,
  type McpClientResponse,
  type McpSetupResponse,
  type McpSetupServer,
  type McpSetupService,
  type NewMcpClientResponse,
  type OAuthSettingsResponse,
  type ProvisionedMcpSetupResponse,
  type ScopeCatalog,
  type UserMe,
} from "@ihsp/api"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CopyButton,
  Dropdown,
  FieldLabel,
  LoadingButton,
} from "@ihsp/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useId, useState } from "react"
import { ErrorAlert } from "../../shared/components/error-alert"
import { QueryBoundary } from "../../shared/components/query-boundary"
import { TextField } from "../../shared/components/text-field"
import { useTr } from "../../shared/hooks/use-tr"
import { allowedServers } from "../utils/connector-config"
import { isSafeRedirectUri, NOTE_CODES, noteKey, oauthRows, sectionsFor, WIZARD_SERVICES } from "../utils/mcp-wizard"
import { LinkedText } from "./linked-text"
import { NewConnectorForm } from "./new-connector-form"

type WizardProps = {
  catalog: ScopeCatalog
  user: UserMe
  /** The static-token path ends here, as the connector form does. The token is handled by the page. */
  onTokenCreated: (created: ConnectorCreated) => void
}

/**
 * MCP-5: choose ChatGPT, Gemini, Claude or Custom, then see the instructions for exactly that service. Every value has
 * a copy button. The secret of an own client lives only in this component's state (shown once, never stored).
 */
export function McpSetupWizard({ catalog, user, onTokenCreated }: WizardProps) {
  const t = useTr()
  const servers = allowedServers(catalog, user.roles)
  const [service, setService] = useState<McpSetupService | null>(null)
  const [server, setServer] = useState<McpSetupServer>(servers[0]?.server ?? "student")
  const [staticToken, setStaticToken] = useState(false)
  const serverId = useId()

  if (servers.length === 0) return <p className="text-muted-foreground text-sm">{t("connectors.new.noServers")}</p>

  if (staticToken) {
    return (
      <div className="grid gap-4">
        <div>
          <Button type="button" variant="ghost" onClick={() => setStaticToken(false)}>
            {t("connectors.mcp.back")}
          </Button>
        </div>
        <NewConnectorForm catalog={catalog} user={user} onCreated={onTokenCreated} />
      </div>
    )
  }

  if (service === null) {
    return (
      <div className="grid gap-4">
        <h2 className="text-base font-semibold">{t("connectors.mcp.chooseTitle")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {WIZARD_SERVICES.map((item) => (
            <li key={item}>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full flex-col items-start gap-1 rounded-card p-4 text-start"
                onClick={() => setService(item)}
              >
                <span className="text-base font-semibold">{t(`connectors.mcp.services.${item}`)}</span>
                <span className="text-muted-foreground text-sm font-normal whitespace-normal">
                  {t(`connectors.mcp.serviceHints.${item}`)}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Button type="button" variant="ghost" onClick={() => setService(null)}>
          {t("connectors.mcp.back")}
        </Button>
        <div className="grid min-w-44 gap-2">
          <FieldLabel htmlFor={serverId}>{t("connectors.mcp.server")}</FieldLabel>
          <Dropdown
            id={serverId}
            className="w-full"
            value={server}
            onValueChange={(next) => setServer(next as McpSetupServer)}
            options={servers.map((item) => ({ value: item.server, label: t(`connectors.server.${item.server}`) }))}
          />
        </div>
      </div>
      <ServiceSetup
        key={`${service}-${server}`}
        service={service}
        server={server}
        onStaticToken={() => setStaticToken(true)}
      />
    </div>
  )
}

type Answer = "yes" | "no"

/**
 * Custom has no fixed redirect address, so the student registers their own client (explicit button, MCP-3). The chat
 * services first ask whether the wizard may pre-create the data; nothing is created before an explicit Yes (MCP-5).
 */
function ServiceSetup({
  service,
  server,
  onStaticToken,
}: {
  service: McpSetupService
  server: McpSetupServer
  onStaticToken: () => void
}) {
  const t = useTr()
  const query = useQuery(getIdMeMcpSetupQuery(service, server))
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [provisioned, setProvisioned] = useState<ProvisionedMcpSetupResponse | null>(null)
  const queryClient = useQueryClient()
  const provision = useMutation({
    mutationFn: () => postIdMeMcpSetup(service, server),
    onSuccess: (result) => {
      setProvisioned(result)
      void queryClient.invalidateQueries({ queryKey: keys.id.mcpClients() })
    },
  })
  const remove = useMutation({
    mutationFn: (clientId: string) => deleteIdMeMcpClient(clientId),
    onSuccess: () => {
      setProvisioned(null)
      setAnswer(null)
      void queryClient.invalidateQueries({ queryKey: keys.id.mcpClients() })
    },
  })

  if (service === "custom") {
    return (
      <QueryBoundary query={query}>
        {(setup) => <ServiceInstructions setup={setup} onStaticToken={onStaticToken} own />}
      </QueryBoundary>
    )
  }

  return (
    <QueryBoundary query={query}>
      {(setup) => {
        // While the Yes request is in flight the question stays up with both buttons disabled,
        // so a second click cannot start another provision.
        if (answer === null || (answer === "yes" && provision.isPending)) {
          return (
            <ProvisionQuestion
              pending={provision.isPending}
              onAnswer={(next) => {
                if (provision.isPending) return
                setAnswer(next)
                if (next === "yes") provision.mutate()
              }}
            />
          )
        }
        if (answer === "no") return <ServiceInstructions setup={setup} onStaticToken={onStaticToken} />
        if (!provisioned) {
          return (
            <div className="grid gap-4">
              <ErrorAlert error={provision.error} />
              {provision.isPending ? <p className="text-muted-foreground text-sm">{t("idCommon.working")}</p> : null}
            </div>
          )
        }
        return (
          <div className="grid gap-6">
            <ServiceInstructions
              setup={setup}
              onStaticToken={onStaticToken}
              provisioned={provisioned}
              onDelete={() => remove.mutate(provisioned.client.client_id)}
              deleting={remove.isPending}
            />
            <ErrorAlert error={remove.error} />
          </div>
        )
      }}
    </QueryBoundary>
  )
}

function ProvisionQuestion({ pending, onAnswer }: { pending: boolean; onAnswer: (answer: Answer) => void }) {
  const t = useTr()
  return (
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold">{t("connectors.mcp.provision.question")}</h3>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending} onClick={() => onAnswer("yes")}>
          {t("connectors.mcp.provision.yes")}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => onAnswer("no")}>
          {t("connectors.mcp.provision.no")}
        </Button>
      </div>
    </section>
  )
}

function ValueRow({ label, value }: { label: string; value: string }) {
  const t = useTr()
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-sm">{label}</span>
      <div className="flex flex-wrap items-start gap-2">
        <code className="bg-muted min-w-0 flex-1 rounded-lg p-2 text-sm break-all whitespace-pre-line">{value}</code>
        <CopyButton value={value} label={t("connectors.mcp.copyNamed", { name: label })} size="sm" />
      </div>
    </div>
  )
}

/**
 * The instructions of one service. `provisioned` fills in the client the wizard created for the student (its secret
 * only when this answer created it); `own` shows the form of a custom client, which the student creates by hand.
 */
function ServiceInstructions({
  setup,
  onStaticToken,
  own = false,
  provisioned = null,
  onDelete,
  deleting = false,
}: {
  setup: McpSetupResponse
  onStaticToken: () => void
  own?: boolean
  provisioned?: ProvisionedMcpSetupResponse | null
  onDelete?: () => void
  deleting?: boolean
}) {
  const t = useTr()
  const sections = sectionsFor(setup.auth_modes)
  const notes = setup.notes.filter((code) => (NOTE_CODES as readonly string[]).includes(code))
  const service = setup.service
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground text-sm">{t("connectors.mcp.availability")}</span>
        <Badge>{t(`connectors.mcp.availabilityValue.${setup.availability}`)}</Badge>
      </div>

      {notes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("connectors.mcp.notesTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid list-disc gap-2 ps-5 text-sm">
              {notes.map((code) => (
                <li key={code}>
                  <LinkedText text={t(noteKey(code))} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <ol className="grid gap-3">
        {(["s1", "s2", "s3"] as const).map((step) => (
          <li key={step} className="text-sm">
            <LinkedText text={t(`connectors.mcp.steps.${service}.${step}`)} />
          </li>
        ))}
      </ol>

      <ValueRow label={t("connectors.mcp.serverUrl")} value={setup.server_url} />

      {sections.connectInApp ? (
        <section className="grid gap-1">
          <h3 className="text-sm font-semibold">{t("connectors.mcp.connectInApp.title")}</h3>
          <p className="text-muted-foreground text-sm">{t("connectors.mcp.connectInApp.text")}</p>
        </section>
      ) : null}

      {provisioned ? (
        <section className="border-border grid gap-3 rounded-card border p-4">
          <h3 className="text-sm font-semibold">{t("connectors.mcp.provision.createdTitle")}</h3>
          <ValueRow label={t("connectors.mcp.provision.clientId")} value={provisioned.client.client_id} />
          {provisioned.client_secret ? (
            <div className="grid gap-1">
              <span className="text-muted-foreground text-sm">{t("connectors.mcp.provision.secret")}</span>
              <div className="flex flex-wrap items-start gap-2">
                <code
                  data-testid="mcp-client-secret"
                  className="bg-muted min-w-0 flex-1 rounded-lg p-2 text-sm break-all"
                >
                  {provisioned.client_secret}
                </code>
                <CopyButton
                  value={provisioned.client_secret}
                  label={t("connectors.mcp.copyNamed", { name: t("connectors.mcp.provision.secret") })}
                  size="sm"
                />
              </div>
              <p className="text-muted-foreground text-sm">{t("connectors.mcp.provision.secretOnce")}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("connectors.mcp.provision.reused")}</p>
          )}
          {onDelete ? (
            <div>
              <Button type="button" variant="outline" disabled={deleting} onClick={onDelete}>
                {t("connectors.mcp.provision.delete")}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {own && setup.oauth ? <OwnClientSection service={service} server={setup.server} oauth={setup.oauth} /> : null}

      {setup.oauth ? (
        <section className="grid gap-4">
          <h3 className="text-sm font-semibold">{t("connectors.mcp.oauth.title")}</h3>
          {oauthRows(setup.oauth, service).map((row) => (
            <ValueRow key={row.key} label={t(`connectors.mcp.oauth.fields.${row.key}`)} value={row.value} />
          ))}
          {setup.token_route ? (
            <ValueRow label={t("connectors.mcp.oauth.tokenRoute")} value={setup.token_route} />
          ) : null}
        </section>
      ) : null}

      {sections.staticToken ? (
        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">{t("connectors.mcp.staticToken.title")}</h3>
          <p className="text-muted-foreground text-sm">{t("connectors.mcp.staticToken.text")}</p>
          <div>
            <Button type="button" variant="outline" onClick={onStaticToken}>
              {t("connectors.mcp.staticToken.action")}
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

/** Creates an own OAuth client; the secret is held in state only until the user leaves the wizard. */
function OwnClientSection({
  service,
  server,
  oauth,
}: {
  service: McpSetupService
  server: McpSetupServer
  oauth: OAuthSettingsResponse
}) {
  const t = useTr()
  const queryClient = useQueryClient()
  const clients = useQuery(getIdMeMcpClientsQuery())
  const [redirect, setRedirect] = useState(oauth.redirect_uris[0] ?? "")
  const [showError, setShowError] = useState(false)
  const [created, setCreated] = useState<NewMcpClientResponse | null>(null)

  const create = useMutation({
    mutationFn: () => postIdMeMcpClient({ service, server, redirect_uri: redirect.trim() }),
    onSuccess: (result) => {
      setCreated(result)
      void queryClient.invalidateQueries({ queryKey: keys.id.mcpClients() })
    },
  })

  const remove = useMutation({
    mutationFn: (clientId: string) => deleteIdMeMcpClient(clientId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: keys.id.mcpClients() }),
  })

  function submit() {
    if (!isSafeRedirectUri(redirect)) {
      setShowError(true)
      return
    }
    setShowError(false)
    create.mutate()
  }

  return (
    <section className="grid gap-4">
      <h3 className="text-sm font-semibold">{t("connectors.mcp.ownClient.title")}</h3>
      <TextField
        label={t("connectors.mcp.ownClient.redirect")}
        description={t("connectors.mcp.ownClient.redirectHint")}
        value={redirect}
        onValueChange={(value) => {
          setRedirect(value)
          setShowError(false)
        }}
        error={showError ? t("connectors.mcp.ownClient.invalidRedirect") : null}
      />
      <ErrorAlert error={create.error} />
      <div>
        <LoadingButton type="button" loading={create.isPending} loadingLabel={t("idCommon.working")} onClick={submit}>
          {t("connectors.mcp.ownClient.create")}
        </LoadingButton>
      </div>

      {created ? (
        <div role="status" className="border-border grid gap-3 rounded-card border p-4">
          <p className="text-sm font-semibold">{t("connectors.mcp.ownClient.secretTitle")}</p>
          <ValueRow label={t("connectors.mcp.ownClient.clientId")} value={created.client.client_id} />
          <div className="grid gap-1">
            <span className="text-muted-foreground text-sm">{t("connectors.mcp.ownClient.secret")}</span>
            <div className="flex flex-wrap items-start gap-2">
              <code
                data-testid="mcp-client-secret"
                className="bg-muted min-w-0 flex-1 rounded-lg p-2 text-sm break-all"
              >
                {created.client_secret}
              </code>
              <CopyButton
                value={created.client_secret}
                label={t("connectors.mcp.copyNamed", { name: t("connectors.mcp.ownClient.secret") })}
                size="sm"
              />
            </div>
          </div>
          <p className="text-muted-foreground text-sm">{t("connectors.mcp.ownClient.secretOnce")}</p>
        </div>
      ) : null}

      <div className="grid gap-3">
        <h4 className="text-sm font-semibold">{t("connectors.mcp.ownClient.clients")}</h4>
        <QueryBoundary query={clients}>
          {(list) => (
            <OwnClientList
              clients={list.filter((client) => client.service === service && client.server === server)}
              onDelete={(clientId) => remove.mutate(clientId)}
              deleting={remove.isPending}
            />
          )}
        </QueryBoundary>
        <ErrorAlert error={remove.error} />
      </div>
    </section>
  )
}

function OwnClientList({
  clients,
  onDelete,
  deleting,
}: {
  clients: McpClientResponse[]
  onDelete: (clientId: string) => void
  deleting: boolean
}) {
  const t = useTr()
  if (clients.length === 0)
    return <p className="text-muted-foreground text-sm">{t("connectors.mcp.ownClient.noClients")}</p>
  return (
    <ul className="grid gap-3">
      {clients.map((client) => (
        <li key={client.client_id} className="grid gap-2">
          <ValueRow label={t("connectors.mcp.ownClient.clientId")} value={client.client_id} />
          <div>
            <Button type="button" variant="outline" disabled={deleting} onClick={() => onDelete(client.client_id)}>
              {t("connectors.mcp.ownClient.delete")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

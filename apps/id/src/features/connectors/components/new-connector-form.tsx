"use client"

import { postConnector, type ConnectorCreated, type ScopeCatalog, type UserMe } from "@ihsp/api"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FieldLabel,
  LoadingButton,
  NativeSelect,
  NativeSelectOption,
} from "@ihsp/ui"
import { useMutation } from "@tanstack/react-query"
import { useId, useState } from "react"
import { CodeInput } from "../../shared/components/code-input"
import { ErrorAlert } from "../../shared/components/error-alert"
import { StepUpSender } from "../../shared/components/step-up-sender"
import { TextField } from "../../shared/components/text-field"
import { useTr } from "../../shared/hooks/use-tr"
import { allowedServers, expiryOptions, type McpServer } from "../utils/connector-config"
import { CoursePicker } from "./course-picker"
import { ScopePicker } from "./scope-picker"

const SERVER_KEYS = {
  student: "connectors.server.student",
  lms: "connectors.server.lms",
  admin: "connectors.server.admin",
} as const

type NewConnectorFormProps = {
  catalog: ScopeCatalog
  user: UserMe
  onCreated: (created: ConnectorCreated) => void
}

/** UF-MCP-01 steps 1-5: server, preset or scopes, courses (LMS), name, expiry, and an OTP check for Administration. */
export function NewConnectorForm({ catalog, user, onCreated }: NewConnectorFormProps) {
  const t = useTr()
  const servers = allowedServers(catalog, user.roles)
  const serverId = useId()
  const expiryId = useId()
  const [server, setServer] = useState<McpServer | "">(servers[0]?.server ?? "")
  const entry = servers.find((item) => item.server === server)
  const [preset, setPreset] = useState("custom")
  const [scopes, setScopes] = useState<string[]>([])
  const [courseIds, setCourseIds] = useState<string[]>([])
  const [name, setName] = useState("")
  const [days, setDays] = useState(30)
  const [code, setCode] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const mutation = useMutation({
    mutationFn: (current: McpServer) =>
      postConnector({
        server: current,
        name: name.trim(),
        scopes,
        course_ids: current === "lms" && courseIds.length > 0 ? courseIds : undefined,
        expires_in_days: days,
        otp_code: current === "admin" ? code : undefined,
      }),
    onSuccess: onCreated,
  })

  function changeServer(next: McpServer) {
    setServer(next)
    setPreset("custom")
    setScopes([])
    setCourseIds([])
    setDays(Math.min(days, expiryOptions(next).at(-1) ?? 30))
    setCode("")
  }

  const nameError = showErrors && name.trim() === "" ? t("idCommon.validation.required") : null
  const codeMissing = server === "admin" && code.length !== 6

  function submit() {
    setShowErrors(true)
    if (!server || name.trim() === "" || scopes.length === 0 || codeMissing) return
    mutation.mutate(server)
  }

  if (!entry || !server) {
    return (
      <Card>
        <CardContent>{t("connectors.new.noServers")}</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("connectors.new.title")}</CardTitle>
        <CardDescription>{t("connectors.new.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <div className="grid gap-2">
            <FieldLabel htmlFor={serverId}>{t("connectors.new.server")}</FieldLabel>
            <NativeSelect
              id={serverId}
              className="w-full"
              value={server}
              onChange={(event) => changeServer(event.target.value as McpServer)}
            >
              {servers.map((item) => (
                <NativeSelectOption key={item.server} value={item.server}>
                  {t(SERVER_KEYS[item.server])}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <ScopePicker
            entry={entry}
            scopes={scopes}
            preset={preset}
            onPreset={(next, nextScopes) => {
              setPreset(next)
              setScopes(nextScopes)
            }}
            onScopes={(next) => {
              setPreset("custom")
              setScopes(next)
            }}
          />
          {showErrors && scopes.length === 0 ? (
            <p role="alert" className="text-destructive text-sm">
              {t("connectors.new.scopesRequired")}
            </p>
          ) : null}
          {server === "lms" ? <CoursePicker selected={courseIds} onChange={setCourseIds} /> : null}
          <TextField
            label={t("connectors.new.name")}
            description={t("connectors.new.nameHint")}
            value={name}
            onValueChange={setName}
            error={nameError}
            maxLength={60}
            autoComplete="off"
          />
          <div className="grid gap-2">
            <FieldLabel htmlFor={expiryId}>{t("connectors.new.expiry")}</FieldLabel>
            <NativeSelect
              id={expiryId}
              className="w-full"
              value={String(days)}
              onChange={(event) => setDays(Number(event.target.value))}
            >
              {expiryOptions(server).map((option) => (
                <NativeSelectOption key={option} value={String(option)}>
                  {t("connectors.new.days", { count: option })}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {server === "admin" ? (
              <p className="text-muted-foreground text-sm">{t("connectors.new.adminLimit")}</p>
            ) : null}
          </div>
          {server === "admin" ? (
            <div className="grid gap-3">
              <p className="text-muted-foreground text-sm">{t("connectors.new.adminOtp")}</p>
              <CodeInput value={code} onChange={setCode} label={t("idCommon.code")} />
              <StepUpSender />
              {showErrors && codeMissing ? (
                <p role="alert" className="text-destructive text-sm">
                  {t("idCommon.validation.code")}
                </p>
              ) : null}
            </div>
          ) : null}
          <ErrorAlert error={mutation.error} />
          <LoadingButton
            type="submit"
            className="h-11 text-base"
            loading={mutation.isPending}
            loadingLabel={t("idCommon.working")}
          >
            {t("connectors.new.submit")}
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  )
}

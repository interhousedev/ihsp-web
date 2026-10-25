"use client"

import {
  getAdminAiAccessQuery,
  getAdminAiStudentsQuery,
  keys,
  putAdminAiAccess,
  type AdminStudentItem,
  type AiAccessBody,
  type AiAccessItem,
} from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Card, CardContent, CardHeader, CardTitle, ConfirmDialog, Input, Label, Switch } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { QueryState } from "../../shared/components/query-state"
import { useAdminMutation } from "../../shared/hooks/use-admin-mutation"

type Scope = "ai_chat_blocked" | "ai_notebooks_blocked"
/** A switch the administrator flipped, waiting for the confirm step. `value` is the new blocked flag. */
type Pending = { field: Scope; value: boolean }

/** Per-user revocation of the chat and notebook AI: pick a student, then switch a scope off or on (confirmed). */
export function AiAccessSection() {
  const t = useT("limits")
  const [search, setSearch] = useState("")
  const [student, setStudent] = useState<AdminStudentItem | null>(null)
  const query = search.trim()
  const found = useQuery({ ...getAdminAiStudentsQuery(query), enabled: query.length >= 2 && student === null })
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("access.title")}</CardTitle>
        <p className="text-muted-foreground text-sm">{t("access.description")}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {student ? (
          <AccessSwitches
            key={student.id}
            student={student}
            onChangeStudent={() => {
              setStudent(null)
              setSearch("")
            }}
          />
        ) : (
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-access-search">{t("access.search")}</Label>
            <Input
              id="ai-access-search"
              value={search}
              placeholder={t("access.searchPlaceholder")}
              onChange={(event) => setSearch(event.target.value)}
            />
            {found.data && found.data.items.length > 0 ? (
              <ul className="flex flex-col">
                {found.data.items.map((item) => (
                  <li key={item.id}>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setStudent(item)}
                    >
                      {item.name}
                      {item.login ? <span className="text-muted-foreground ms-2 text-xs">{item.login}</span> : null}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** The two switches of one student; a flip opens the confirm dialog, and only the confirm saves. */
function AccessSwitches({ student, onChangeStudent }: { student: AdminStudentItem; onChangeStudent: () => void }) {
  const access = useQuery(getAdminAiAccessQuery(student.id))
  return (
    <QueryState query={access} rows={2}>
      {(current) => <Switches student={student} current={current} onChangeStudent={onChangeStudent} />}
    </QueryState>
  )
}

function Switches({
  student,
  current,
  onChangeStudent,
}: {
  student: AdminStudentItem
  current: AiAccessItem
  onChangeStudent: () => void
}) {
  const t = useT("limits")
  const [pending, setPending] = useState<Pending | null>(null)
  const save = useAdminMutation<AiAccessBody, AiAccessItem>({
    mutationFn: (body) => putAdminAiAccess(student.id, body),
    invalidate: [keys.admin.aiAccess(student.id)],
    success: t("access.saved"),
    onSuccess: () => setPending(null),
  })
  const flags: AiAccessBody = {
    ai_chat_blocked: current.ai_chat_blocked,
    ai_notebooks_blocked: current.ai_notebooks_blocked,
  }
  const scopeName = (field: Scope) => (field === "ai_chat_blocked" ? t("access.chat") : t("access.notebooks"))
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium">{student.name}</p>
        <Button type="button" size="sm" variant="ghost" onClick={onChangeStudent}>
          {t("access.change")}
        </Button>
      </div>
      <ScopeSwitch
        label={t("access.chat")}
        blocked={flags.ai_chat_blocked}
        disabled={save.isPending}
        onRequest={(value) => setPending({ field: "ai_chat_blocked", value })}
      />
      <ScopeSwitch
        label={t("access.notebooks")}
        blocked={flags.ai_notebooks_blocked}
        disabled={save.isPending}
        onRequest={(value) => setPending({ field: "ai_notebooks_blocked", value })}
      />
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        title={
          pending
            ? t(pending.value ? "access.confirmRevoke" : "access.confirmRestore", {
                scope: scopeName(pending.field),
                name: student.name,
              })
            : ""
        }
        confirmLabel={t("access.confirm")}
        destructive={pending?.value === true}
        loading={save.isPending}
        onConfirm={() => {
          if (pending) save.mutate({ ...flags, [pending.field]: pending.value })
        }}
      />
    </div>
  )
}

/** One scope: the switch is on while the user HAS the AI (not blocked). */
function ScopeSwitch({
  label,
  blocked,
  disabled,
  onRequest,
}: {
  label: string
  blocked: boolean
  disabled: boolean
  onRequest: (blocked: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <Switch checked={!blocked} disabled={disabled} onCheckedChange={(checked) => onRequest(!checked)} />
    </label>
  )
}

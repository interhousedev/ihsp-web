"use client"

import type { AccessAudience, AccessRule, AccessRuleBody, WhenDenied } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, LoadingButton } from "@ihsp/ui"
import { useState } from "react"
import { GroupPicker } from "../../settings/components/group-picker"
import { AccessUserPicker } from "./access-user-picker"

const AUDIENCES: AccessAudience[] = ["public", "signed_in", "students", "chosen"]
const DENIALS: WhenDenied[] = ["hidden", "locked"]

/**
 * One rule: who may open (audience, with groups and people for `chosen`) and what the others see (hidden or locked).
 * Read-only staff see the rule without controls to change it.
 */
export function AccessRuleForm({
  courseId,
  rule,
  readOnly,
  pending,
  error,
  idPrefix,
  onSave,
}: {
  courseId: string
  rule: AccessRule
  readOnly: boolean
  pending: boolean
  error: unknown
  idPrefix: string
  onSave: (body: AccessRuleBody) => void
}) {
  const t = useT("access")
  const errorMessage = useErrorMessage()
  const [audience, setAudience] = useState(rule.audience)
  const [denied, setDenied] = useState(rule.when_denied)
  const [groups, setGroups] = useState(rule.group_ids)
  const [users, setUsers] = useState(rule.users.map((user) => user.id))
  const chosen = audience === "chosen"
  const dirty =
    audience !== rule.audience ||
    (audience !== "public" && denied !== rule.when_denied) ||
    (chosen && (groups.join() !== rule.group_ids.join() || users.join() !== rule.users.map((u) => u.id).join()))
  const nobodyChosen = chosen && groups.length === 0 && users.length === 0
  const canSave = dirty && !nobodyChosen
  function save() {
    onSave(
      audience === "public"
        ? { audience }
        : { audience, when_denied: denied, ...(chosen ? { group_ids: groups, user_ids: users } : {}) },
    )
  }
  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2" disabled={readOnly}>
        <legend className="mb-1 text-sm font-semibold">{t("audience")}</legend>
        {AUDIENCES.map((value) => (
          <label key={value} className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
            <input
              type="radio"
              name={`${idPrefix}-audience`}
              value={value}
              checked={audience === value}
              onChange={() => setAudience(value)}
              className="size-4"
            />
            {t(`audiences.${value}`)}
          </label>
        ))}
      </fieldset>
      {chosen ? (
        <fieldset className="flex flex-col gap-4" disabled={readOnly}>
          {readOnly ? (
            <ul aria-label={t("groups")} className="text-sm">
              {rule.group_ids.length === 0 ? <li className="text-muted-foreground">{t("noGroups")}</li> : null}
            </ul>
          ) : null}
          {readOnly && rule.group_ids.length > 0 ? null : (
            <GroupPicker value={groups} onChange={readOnly ? () => undefined : setGroups} />
          )}
          <AccessUserPicker
            courseId={courseId}
            value={users}
            known={rule.users}
            readOnly={readOnly}
            onChange={setUsers}
          />
        </fieldset>
      ) : null}
      {audience !== "public" ? (
        <fieldset className="flex flex-col gap-2" disabled={readOnly}>
          <legend className="mb-1 text-sm font-semibold">{t("whenDenied")}</legend>
          {DENIALS.map((value) => (
            <label key={value} className="flex min-h-11 items-center gap-3 text-sm md:min-h-8">
              <input
                type="radio"
                name={`${idPrefix}-denied`}
                value={value}
                checked={denied === value}
                onChange={() => setDenied(value)}
                className="size-4"
              />
              {t(`denied.${value}`)}
            </label>
          ))}
        </fieldset>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}
      {readOnly ? (
        <p className="text-muted-foreground text-xs">{t("readOnly")}</p>
      ) : (
        <div>
          <LoadingButton loading={pending} disabled={!canSave} onClick={save} className="min-h-11 md:min-h-8">
            {t("save")}
          </LoadingButton>
        </div>
      )}
    </div>
  )
}

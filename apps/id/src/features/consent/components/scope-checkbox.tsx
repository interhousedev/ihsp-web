"use client"

import { CheckboxRow, scopeHintKey, useTr } from "@ihsp/features-core/id-account"
import { admissionScope, admissionScopeKey } from "../utils/admission-scopes"

type ScopeCheckboxProps = {
  scope: string
  server: string | null
  tools: string[]
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** One requested scope with the tools it allows; the whole row is the touch target. */
export function ScopeCheckbox({ scope, server, tools, checked, onCheckedChange }: ScopeCheckboxProps) {
  const t = useTr()
  const admission = admissionScope(server, scope)
  const hint = admission === null ? scopeHintKey(scope) : admissionScopeKey(admission)
  return (
    <CheckboxRow checked={checked} onCheckedChange={onCheckedChange} ariaLabel={scope}>
      <code className="text-sm font-medium break-all">{scope}</code>
      {t.has(hint) ? <span className="text-xs">{t(hint)}</span> : null}
      {tools.length > 0 ? (
        <span className="text-muted-foreground text-xs">{t("consent.tools", { tools: tools.join(", ") })}</span>
      ) : null}
    </CheckboxRow>
  )
}

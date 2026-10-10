"use client"

import { CheckboxRow } from "../../shared/components/checkbox-row"
import { useTr } from "../../shared/hooks/use-tr"
import { scopeHintKey } from "../../connectors/utils/connector-config"

type ScopeCheckboxProps = {
  scope: string
  tools: string[]
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

/** One requested scope with the tools it allows; the whole row is the touch target. */
export function ScopeCheckbox({ scope, tools, checked, onCheckedChange }: ScopeCheckboxProps) {
  const t = useTr()
  return (
    <CheckboxRow checked={checked} onCheckedChange={onCheckedChange} ariaLabel={scope}>
      <code className="text-sm font-medium break-all">{scope}</code>
      {t.has(scopeHintKey(scope)) ? <span className="text-xs">{t(scopeHintKey(scope))}</span> : null}
      {tools.length > 0 ? (
        <span className="text-muted-foreground text-xs">{t("consent.tools", { tools: tools.join(", ") })}</span>
      ) : null}
    </CheckboxRow>
  )
}

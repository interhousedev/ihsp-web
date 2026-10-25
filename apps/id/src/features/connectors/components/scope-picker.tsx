"use client"

import type { ScopeCatalog } from "@ihsp/api"
import { Label, RadioGroup, RadioGroupItem } from "@ihsp/ui"
import { CheckboxRow } from "../../shared/components/checkbox-row"
import { useTr } from "../../shared/hooks/use-tr"
import { humanizeKey, scopeHintKey } from "../utils/connector-config"

const CUSTOM = "custom"

type ScopePickerProps = {
  entry: ScopeCatalog["servers"][number]
  scopes: string[]
  preset: string
  onPreset: (preset: string, scopes: string[]) => void
  onScopes: (scopes: string[]) => void
}

/** MCP-2: a task preset or individual scopes; every scope shows the tools it allows. */
export function ScopePicker({ entry, scopes, preset, onPreset, onScopes }: ScopePickerProps) {
  const t = useTr()
  // The backend names presets in kebab-case (`study-planner`); the message keys are snake_case.
  const presetLabel = (key: string) => {
    const messageKey = `connectors.presets.${key.replaceAll("-", "_")}`
    return t.has(messageKey) ? t(messageKey) : humanizeKey(key)
  }

  function toggle(scope: string, checked: boolean) {
    onScopes(checked ? [...scopes, scope] : scopes.filter((item) => item !== scope))
  }

  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">{t("connectors.new.preset")}</legend>
        <RadioGroup
          value={preset}
          onValueChange={(value) => {
            const selected = entry.presets.find((item) => item.key === value)
            onPreset(value, selected ? selected.scopes : scopes)
          }}
          className="grid gap-2"
        >
          {entry.presets.map((item) => (
            <div key={item.key} className="flex min-h-11 items-center gap-3">
              <RadioGroupItem value={item.key} id={`preset-${item.key}`} />
              <Label htmlFor={`preset-${item.key}`} className="font-normal">
                {presetLabel(item.key)}
              </Label>
            </div>
          ))}
          <div className="flex min-h-11 items-center gap-3">
            <RadioGroupItem value={CUSTOM} id="preset-custom" />
            <Label htmlFor="preset-custom" className="font-normal">
              {t("connectors.new.custom")}
            </Label>
          </div>
        </RadioGroup>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="mb-1 text-sm font-medium">{t("connectors.new.scopes")}</legend>
        {entry.scopes.map((item) => (
          <CheckboxRow
            key={item.scope}
            ariaLabel={item.scope}
            checked={scopes.includes(item.scope)}
            onCheckedChange={(checked) => toggle(item.scope, checked)}
          >
            <code className="text-sm font-medium break-all">{item.scope}</code>
            {t.has(scopeHintKey(item.scope)) ? <span className="text-xs">{t(scopeHintKey(item.scope))}</span> : null}
            <span className="text-muted-foreground text-xs">
              {t("consent.tools", { tools: item.tools.join(", ") })}
            </span>
          </CheckboxRow>
        ))}
      </fieldset>
    </div>
  )
}

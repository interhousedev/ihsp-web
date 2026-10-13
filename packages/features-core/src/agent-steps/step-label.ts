import type { AgentStep } from "@ihsp/api"

/** The message key (under `assistant.steps`) and its values for one step; `fallback` for an unnamed tool. */
export type StepLabel = { key: string; values: Record<string, string>; fallback?: string }

const KIND_KEYS: Record<AgentStep["kind"], string> = {
  read_file: "readFile",
  web_search: "webSearch",
  retrieve: "retrieve",
  open_view: "openView",
  create: "create",
  tool: "tool",
  think: "think",
}

function humanize(name: string): string {
  const words = name.replace(/_/g, " ").trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** How a step is named in the trace: by kind, the tool name for tools, a running form while it runs. */
export function stepLabel(step: AgentStep): StepLabel {
  const values: Record<string, string> = step.target ? { target: step.target } : {}
  if (step.kind === "tool") return { key: `tool.${step.label}`, values, fallback: humanize(step.label) }
  const key = KIND_KEYS[step.kind]
  return { key: step.status === "running" ? `running.${key}` : key, values }
}

/** `1.2s` under a minute, `1m 5s` above; empty when the duration is unknown. */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return ""
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

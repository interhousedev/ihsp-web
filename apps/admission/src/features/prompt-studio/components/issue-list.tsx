"use client"

import { useT } from "@ihsp/i18n"
import type { PromptIssue } from "../api"

const ISSUE_KEY: Record<string, string> = {
  empty: "issue.empty",
  too_long: "issue.tooLong",
  unknown_placeholder: "issue.unknownPlaceholder",
  bad_format: "issue.badFormat",
  missing_fairness: "issue.missingFairness",
}

/** Server findings of a draft (blocking codes or warnings) in the staff member's language. */
export function IssueList({ issues, tone }: { issues: PromptIssue[]; tone: "error" | "warning" }) {
  const t = useT("promptStudio")
  if (issues.length === 0) return null
  return (
    <ul
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "text-destructive flex flex-col gap-1 text-sm"
          : "text-warning-foreground flex flex-col gap-1 text-sm"
      }
    >
      {issues.map((i) => (
        <li key={i.code}>{ISSUE_KEY[i.code] ? t(ISSUE_KEY[i.code] as "issue.empty") : i.detail || i.code}</li>
      ))}
    </ul>
  )
}

/** Blocking codes from a 422 as issues. */
export const asIssues = (codes: string[]): PromptIssue[] =>
  codes.map((code) => ({ severity: "error", code, detail: "" }))

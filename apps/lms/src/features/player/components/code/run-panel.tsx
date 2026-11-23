"use client"

import { useT } from "@ihsp/i18n"
import { Badge, Icons, Tabs, TabsContent, TabsList, TabsTrigger } from "@ihsp/ui"
import type { RunState } from "./use-code-runner"

export type PanelTest = { id: string; name: string; hidden: boolean; code: string }

/** The output console (stdout, stderr, errors) and the per-test results of the last run. */
export function RunPanel({ state, tests }: { state: RunState; tests: PanelTest[] }) {
  const t = useT("codeRunner")
  const result = state.result
  const outcome = new Map((result?.tests ?? []).map((test) => [test.id, test]))
  const ran = result !== null
  const passedCount = tests.filter((test) => outcome.get(test.id)?.passed).length

  return (
    <Tabs defaultValue="output" className="gap-2">
      <TabsList>
        <TabsTrigger value="output" className="min-h-11 md:min-h-8" data-code-tab="output">
          {t("output")}
        </TabsTrigger>
        <TabsTrigger value="tests" className="min-h-11 md:min-h-8" disabled={tests.length === 0} data-code-tab="tests">
          {t("tests")}
          {ran && tests.length > 0 ? (
            <span className="ms-1 tabular-nums opacity-80">
              {passedCount}/{tests.length}
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="output">
        <div
          role="log"
          aria-live="polite"
          aria-label={t("output")}
          className="bg-muted max-h-72 min-h-20 overflow-auto rounded-md p-3 font-mono text-xs break-words whitespace-pre-wrap"
          data-code-output
        >
          {state.phase === "loading" ? <p className="text-muted-foreground">{t("loading")}</p> : null}
          {state.phase === "running" ? <p className="text-muted-foreground">{t("running")}</p> : null}
          {state.stdout ? <span>{state.stdout}</span> : null}
          {state.stderr ? <span className="text-warning">{state.stderr}</span> : null}
          {result?.error ? <span className="text-destructive block">{result.error}</span> : null}
          {result?.timedOut ? <p className="text-destructive font-sans font-medium">{t("timedOut")}</p> : null}
          {state.truncated ? <p className="text-muted-foreground font-sans">{t("truncated")}</p> : null}
          {state.phase === "idle" ? <p className="text-muted-foreground font-sans">{t("idle")}</p> : null}
          {state.phase === "done" && !state.stdout && !state.stderr && !result?.error && !result?.timedOut ? (
            <p className="text-muted-foreground font-sans">{t("noOutput")}</p>
          ) : null}
        </div>
      </TabsContent>
      <TabsContent value="tests">
        <ul className="flex flex-col gap-2" data-code-tests>
          {tests.map((test) => {
            const found = outcome.get(test.id)
            return (
              <li
                key={test.id}
                className="rounded-md border p-2 text-sm"
                data-test-id={test.id}
                data-status={!found ? "not-run" : found.passed ? "passed" : "failed"}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {!found ? (
                    <Icons.circle aria-hidden className="text-muted-foreground size-4" />
                  ) : found.passed ? (
                    <Icons.circleCheck aria-hidden className="text-success size-4" />
                  ) : (
                    <Icons.circleX aria-hidden className="text-destructive size-4" />
                  )}
                  <span className="font-medium">{test.name || t("unnamedTest")}</span>
                  <span className="sr-only">{!found ? t("notRun") : found.passed ? t("passed") : t("failed")}</span>
                  {test.hidden ? <Badge variant="secondary">{t("hiddenTest")}</Badge> : null}
                </div>
                {!test.hidden && test.code ? (
                  <pre className="text-muted-foreground mt-1 overflow-x-auto font-mono text-xs">{test.code}</pre>
                ) : null}
                {found && !found.passed && found.message && !test.hidden ? (
                  <pre className="text-destructive mt-1 overflow-x-auto font-mono text-xs whitespace-pre-wrap">
                    {found.message}
                  </pre>
                ) : null}
              </li>
            )
          })}
        </ul>
      </TabsContent>
    </Tabs>
  )
}

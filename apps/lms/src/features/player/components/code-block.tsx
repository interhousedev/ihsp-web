"use client"

import { postLmsHiddenTests, postLmsWidgetResult, type BlockResult, type LearningCodeBlock } from "@ihsp/api"
import { useErrorMessage, useT } from "@ihsp/i18n"
import { Alert, AlertDescription, Button, Icons, Markdown } from "@ihsp/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { scoreOf } from "../utils/code-runner"
import { refreshProgress } from "../utils/fresh"
import { CodeEditor } from "./code/code-editor"
import { RunPanel, type PanelTest } from "./code/run-panel"
import { useCodeRunner } from "./code/use-code-runner"

/**
 * A runnable code block: the learner edits the starter code and runs it in the browser sandbox (Python, JavaScript,
 * SQL). Run checks the visible tests; Submit of a graded block also fetches the hidden tests, runs everything and
 * reports the score (client-side grading, see public/code-runner/runner.js).
 */
export function CodeBlock({
  block,
  courseId,
  stepId,
  mode,
  slug,
}: {
  block: LearningCodeBlock
  courseId: string
  stepId: string
  mode: "learn" | "preview"
  slug: string | null
}) {
  const t = useT("codeRunner")
  const errorMessage = useErrorMessage()
  const queryClient = useQueryClient()
  const [code, setCode] = useState(block.starter)
  const [tests, setTests] = useState<PanelTest[]>(block.tests)
  const [best, setBest] = useState<BlockResult | null>(block.result ?? null)
  const runner = useCodeRunner(t("frameTitle"))
  const busy = runner.state.phase === "loading" || runner.state.phase === "running"
  const visible = block.tests.filter((test) => !test.hidden)

  const submit = useMutation({
    mutationFn: async () => {
      const hidden = (await postLmsHiddenTests(courseId, stepId, block.id)).tests
      const all = [...visible, ...hidden]
      setTests(block.tests.map((test) => all.find((found) => found.id === test.id) ?? test))
      const result = await runner.run(block.language, code, all, block.time_limit_ms)
      // Reset or another run superseded this one: report nothing.
      if (result.error === "cancelled" && result.tests.length === 0) return best
      const score = scoreOf(
        result,
        all.map((test) => test.id),
      )
      return postLmsWidgetResult(courseId, stepId, block.id, { score_pct: score.scorePct, passed: score.passed })
    },
    onSuccess: (saved) => {
      setBest(saved)
      if (mode === "learn" && saved !== best) void refreshProgress(queryClient, { courseId, stepId, slug })
    },
  })

  function run() {
    setTests(block.tests)
    void runner.run(block.language, code, visible, block.time_limit_ms)
  }

  function reset() {
    setCode(block.starter)
    setTests(block.tests)
    runner.reset()
  }

  return (
    <section className="flex flex-col gap-3" data-block-id={block.id} data-code-block={block.language}>
      {block.instructions ? <Markdown>{block.instructions}</Markdown> : null}
      <CodeEditor value={code} onChange={setCode} language={block.language} label={t("editorLabel")} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={run}
          disabled={busy || submit.isPending}
          className="min-h-11 md:min-h-8"
          data-code-action="run"
        >
          <Icons.play aria-hidden />
          {t("run")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={reset}
          disabled={busy}
          className="min-h-11 md:min-h-8"
          data-code-action="reset"
        >
          <Icons.undo aria-hidden />
          {t("reset")}
        </Button>
        {block.graded && mode === "learn" ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => submit.mutate()}
            data-code-action="submit"
            disabled={busy || submit.isPending}
            className="min-h-11 md:min-h-8"
          >
            <Icons.send aria-hidden />
            {submit.isPending ? t("submitting") : t("submit")}
          </Button>
        ) : null}
        {block.graded && best ? (
          <span
            className="text-muted-foreground text-sm tabular-nums"
            data-code-score={Math.round(best.score)}
            data-completed={best.completed}
          >
            {t("bestScore", { score: Math.round(best.score) })}
            {best.completed ? (
              <Icons.circleCheck aria-label={t("passed")} className="text-success ms-1 inline size-4" />
            ) : null}
          </span>
        ) : null}
        <span className="text-muted-foreground ms-auto text-xs">{t(`languages.${block.language}`)}</span>
      </div>
      {submit.isError ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage(submit.error)}</AlertDescription>
        </Alert>
      ) : null}
      <RunPanel state={runner.state} tests={tests} />
      {runner.frame}
    </section>
  )
}

"use client"

import type { CodeBlock, CodeLanguage } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Alert,
  AlertDescription,
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Icons,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@ihsp/ui"
import { useId } from "react"
import { CodeEditor } from "../../player/components/code/code-editor"
import { RunPanel } from "../../player/components/code/run-panel"
import { useCodeRunner } from "../../player/components/code/use-code-runner"
import { scoreOf } from "../../player/utils/code-runner"
import { MarkdownEditor } from "./markdown-editor"
import { TestsEditor } from "./code/tests-editor"

const LANGUAGES: CodeLanguage[] = ["python", "javascript", "sql"]

/**
 * A runnable code block: language, instructions, starter code, the author's solution (never sent to students), tests
 * and the time limit. "Run solution" checks the solution against every test in the same browser sandbox students use.
 */
export function CodeBlockEditor({ block, onChange }: { block: CodeBlock; onChange: (block: CodeBlock) => void }) {
  const t = useT("codeRunner")
  const ids = { limit: useId(), graded: useId() }
  const runner = useCodeRunner(t("frameTitle"))
  const busy = runner.state.phase === "loading" || runner.state.phase === "running"
  const result = runner.state.phase === "done" ? runner.state.result : null
  const score = result
    ? scoreOf(
        result,
        block.tests.filter((test) => test.code.trim()).map((test) => test.id),
      )
    : null

  const set = (patch: Partial<CodeBlock>) => onChange({ ...block, ...patch })
  const seconds = Math.round(block.time_limit_ms / 1000)

  return (
    <div className="flex flex-col gap-4" data-block-id={block.id}>
      <div className="flex flex-wrap items-end gap-4">
        <Field className="w-48">
          <FieldLabel>{t("language")}</FieldLabel>
          <Select
            value={block.language}
            items={LANGUAGES.map((value) => ({ value, label: t(`languages.${value}`) }))}
            onValueChange={(value) => value && set({ language: value as CodeLanguage })}
          >
            <SelectTrigger aria-label={t("language")} className="min-h-11 w-full md:min-h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`languages.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-36">
          <FieldLabel htmlFor={ids.limit}>{t("timeLimit")}</FieldLabel>
          <Input
            id={ids.limit}
            type="number"
            inputMode="numeric"
            min={1}
            max={30}
            value={seconds}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isFinite(value)) set({ time_limit_ms: Math.min(30, Math.max(1, Math.round(value))) * 1000 })
            }}
            className="min-h-11 md:min-h-8"
          />
        </Field>
        <label htmlFor={ids.graded} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
          <Switch id={ids.graded} checked={block.graded} onCheckedChange={(graded) => set({ graded })} />
          {t("graded")}
        </label>
      </div>
      <Field>
        <FieldLabel>{t("instructions")}</FieldLabel>
        <MarkdownEditor
          value={block.instructions}
          onChange={(instructions) => set({ instructions })}
          label={t("instructions")}
          rows={4}
        />
      </Field>
      <Field>
        <FieldLabel>{t("starter")}</FieldLabel>
        <FieldDescription>{t("starterHint")}</FieldDescription>
        <CodeEditor
          value={block.starter}
          onChange={(starter) => set({ starter })}
          language={block.language}
          label={t("starter")}
        />
      </Field>
      <Field>
        <FieldLabel>{t("solution")}</FieldLabel>
        <FieldDescription>{t("solutionHint")}</FieldDescription>
        <CodeEditor
          value={block.solution}
          onChange={(solution) => set({ solution })}
          language={block.language}
          label={t("solution")}
        />
      </Field>
      <Field>
        <FieldLabel>{t("tests")}</FieldLabel>
        <FieldDescription>{t("hiddenHint")}</FieldDescription>
        <TestsEditor tests={block.tests} language={block.language} onChange={(tests) => set({ tests })} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void runner.run(block.language, block.solution, block.tests, block.time_limit_ms)}
          className="min-h-11 md:min-h-8"
          data-code-action="run-solution"
        >
          <Icons.play aria-hidden />
          {t("runSolution")}
        </Button>
        {score ? (
          <span className="text-sm tabular-nums" data-solution-score={Math.round(score.scorePct)}>
            {score.passed ? t("solutionPasses") : t("solutionFails", { score: Math.round(score.scorePct) })}
          </span>
        ) : null}
      </div>
      {result && !score?.passed ? (
        <Alert>
          <AlertDescription>{t("solutionFailsHint")}</AlertDescription>
        </Alert>
      ) : null}
      {runner.state.phase !== "idle" ? <RunPanel state={runner.state} tests={block.tests} /> : null}
      {runner.frame}
    </div>
  )
}

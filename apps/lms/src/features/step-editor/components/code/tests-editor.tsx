"use client"

import type { CodeLanguage, CodeTest } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import { Button, Icons, Input, Switch } from "@ihsp/ui"
import { useId } from "react"
import { CodeEditor } from "../../../player/components/code/code-editor"

const MAX_TESTS = 30

/** The tests of a code block: a name, the test code and whether students see only the name. */
export function TestsEditor({
  tests,
  language,
  onChange,
}: {
  tests: CodeTest[]
  language: CodeLanguage
  onChange: (tests: CodeTest[]) => void
}) {
  const t = useT("codeRunner")
  const baseId = useId()

  const update = (index: number, patch: Partial<CodeTest>) =>
    onChange(tests.map((test, i) => (i === index ? { ...test, ...patch } : test)))

  function add() {
    onChange([...tests, { id: `t-${crypto.randomUUID().slice(0, 8)}`, name: "", code: "", hidden: false }])
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs">{t(`testHints.${language}`)}</p>
      {tests.map((test, index) => (
        <fieldset key={test.id} className="flex flex-col gap-2 rounded-md border p-3" data-test-id={test.id}>
          <legend className="sr-only">{t("testNumber", { n: index + 1 })}</legend>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={test.name}
              maxLength={200}
              placeholder={t("testName")}
              aria-label={t("testName")}
              onChange={(event) => update(index, { name: event.target.value })}
              className="min-h-11 min-w-40 flex-1 md:min-h-8"
            />
            <label htmlFor={`${baseId}-${index}`} className="flex min-h-11 items-center gap-2 text-sm md:min-h-8">
              <Switch
                id={`${baseId}-${index}`}
                checked={test.hidden}
                onCheckedChange={(hidden) => update(index, { hidden })}
              />
              {t("hidden")}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("removeTest")}
              onClick={() => onChange(tests.filter((_, i) => i !== index))}
              className="size-11 md:size-8"
            >
              <Icons.trash aria-hidden />
            </Button>
          </div>
          <CodeEditor
            value={test.code}
            onChange={(code) => update(index, { code: code.slice(0, 5000) })}
            language={language}
            label={t("testCode")}
            minLines={2}
          />
        </fieldset>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={add}
        disabled={tests.length >= MAX_TESTS}
        className="min-h-11 self-start md:min-h-8"
      >
        <Icons.add aria-hidden />
        {t("addTest")}
      </Button>
    </div>
  )
}

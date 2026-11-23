"use client"

import { javascript } from "@codemirror/lang-javascript"
import { python } from "@codemirror/lang-python"
import { sql } from "@codemirror/lang-sql"
import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import type { CodeLanguage } from "@ihsp/api"
import { basicSetup } from "codemirror"
import { useEffect, useRef } from "react"

const languages = { python, javascript, sql } as const

const theme = EditorView.theme({
  "&": { fontSize: "13px", backgroundColor: "var(--background)", color: "var(--foreground)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "var(--font-mono, ui-monospace, monospace)", lineHeight: "1.5" },
  ".cm-gutters": { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", border: "none" },
  ".cm-content": { caretColor: "var(--foreground)" },
})

/** A CodeMirror 6 editor for code blocks (learner panel and author editor). */
export function CodeEditor({
  value,
  onChange,
  language,
  label,
  readOnly = false,
  minLines = 6,
}: {
  value: string
  onChange?: (value: string) => void
  language: CodeLanguage
  label: string
  readOnly?: boolean
  minLines?: number
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const latest = useRef(value)
  latest.current = value

  useEffect(() => {
    if (!host.current) return
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: latest.current,
        extensions: [
          basicSetup,
          languages[language](),
          theme,
          EditorView.lineWrapping,
          EditorState.readOnly.of(readOnly),
          EditorView.editable.of(!readOnly),
          EditorView.contentAttributes.of({ "aria-label": label }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current?.(update.state.doc.toString())
          }),
        ],
      }),
    })
    view.current = editor
    return () => {
      editor.destroy()
      view.current = null
    }
  }, [language, readOnly, label])

  // Outside changes (Reset, another block version) replace the document.
  useEffect(() => {
    const editor = view.current
    if (!editor || editor.state.doc.toString() === value) return
    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } })
  }, [value])

  return (
    <div
      ref={host}
      className="border-input overflow-hidden rounded-md border text-sm"
      style={{ minHeight: `${minLines * 1.5 + 0.5}rem` }}
      data-code-editor={language}
    />
  )
}

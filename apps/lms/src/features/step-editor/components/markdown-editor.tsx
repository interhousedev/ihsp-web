"use client"

import { useT } from "@ihsp/i18n"
import { cn, Markdown, Textarea, useIsMobile } from "@ihsp/ui"
import {
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  useDeferredValue,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useMarkdownTextarea } from "../hooks/use-markdown-textarea"
import { caretCoordinates } from "../utils/caret-coordinates"
import { EDITOR_SHORTCUTS, type ShortcutAction } from "../utils/editor-shortcuts"
import { activeBlockFormats, type BlockFormat, toggleBlock } from "../utils/markdown/block-format"
import { codeBlockAt, toggleCodeBlock } from "../utils/markdown/code-block"
import { continueList } from "../utils/markdown/continue-list"
import { htmlToMarkdown } from "../utils/markdown/html-to-markdown"
import { activeInlineFormats, toggleInline } from "../utils/markdown/inline-format"
import { applyLink, linkAt, linkDraftAt, removeLink } from "../utils/markdown/link-format"
import { indexMarkdown, type InlineFormat } from "../utils/markdown/markdown-index"
import { type Formula, formulaAt, insertFormula, mathAt } from "../utils/markdown/math-format"
import type { TextState } from "../utils/markdown/text-state"
import { matchesShortcut } from "../utils/shortcut-label"
import { BlockToolbar } from "./block-toolbar"
import { EditorViewSwitch, type EditorView } from "./editor-view-switch"
import { EquationDialog } from "./equation-dialog"
import { LinkDialog } from "./link-dialog"
import { MarkdownHelp } from "./markdown-help"
import { SelectionToolbar } from "./selection-toolbar"

type OpenDialog =
  | { kind: "equation"; formula: Formula; editing: boolean }
  | { kind: "link"; text: string; url: string; editing: boolean }

/** A Ctrl/⌘+Shift+V paste within this time is pasted as plain text. */
const PLAIN_PASTE_MS = 1000

/**
 * The Markdown editor of text blocks. Markdown stays the stored format; the editor writes it for the author:
 * a floating toolbar over selected text (bold, italic, underline, strikethrough, code, spoiler, link, quote,
 * equation), a toolbar above for headings, lists, code blocks and equations on their own line, keyboard shortcuts,
 * an equation dialog with a live preview, lists that continue on Enter, and HTML pasted as Markdown (Ctrl/⌘+Shift+V
 * pastes plain text). Every change is one native edit, so undo and redo work as for typing. The preview, side by side
 * on wide screens or in its own tab, uses the same renderer as the student's page.
 */
export function MarkdownEditor({
  value,
  onChange,
  label,
  disabled,
  rows = 8,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  disabled?: boolean
  rows?: number
}) {
  const t = useT("markdownEditor")
  const id = useId()
  const isMobile = useIsMobile()
  const textarea = useRef<HTMLTextAreaElement>(null)
  const { selection, sync, read, apply } = useMarkdownTextarea(textarea, value, onChange)
  const [chosenView, setChosenView] = useState<EditorView | null>(null)
  const views: readonly EditorView[] = isMobile ? ["write", "preview"] : ["write", "split", "preview"]
  const view: EditorView = chosenView && views.includes(chosenView) ? chosenView : isMobile ? "write" : "split"
  const [focused, setFocused] = useState(false)
  /** The selection on which Escape hid the floating toolbar; a new selection shows it again. */
  const [dismissedAt, setDismissedAt] = useState<string | null>(null)
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  const [floatingAt, setFloatingAt] = useState<{ top: number; left: number } | null>(null)
  const textBox = useRef<HTMLDivElement>(null)
  const floating = useRef<HTMLDivElement>(null)
  const blockBar = useRef<HTMLDivElement>(null)
  const plainPasteAt = useRef(0)
  const preview = useDeferredValue(value)

  const index = useMemo(() => indexMarkdown(value), [value])
  const state: TextState = {
    text: value,
    start: Math.min(selection.start, value.length),
    end: Math.min(selection.end, value.length),
  }
  const inline = useMemo(
    () => activeInlineFormats({ text: value, start: state.start, end: state.end }, index),
    [index, value, state.start, state.end],
  )
  const blocks = useMemo(
    () => activeBlockFormats({ text: value, start: state.start, end: state.end }, index),
    [index, value, state.start, state.end],
  )
  const inCodeBlock = codeBlockAt(state, index) !== null
  const linked = linkAt(state, index) !== null
  const writing = view !== "preview" && !disabled
  const selectionKey = `${state.start}:${state.end}`
  const dismissed = dismissedAt === selectionKey
  const showFloating = writing && focused && !dismissed && dialog === null && state.start !== state.end

  useLayoutEffect(() => {
    const area = textarea.current
    const box = textBox.current
    const bar = floating.current
    if (!showFloating || !area || !box || !bar) {
      setFloatingAt(null)
      return
    }
    const first = caretCoordinates(area, Math.min(state.start, value.length))
    const last = caretCoordinates(area, Math.min(state.end, value.length))
    // Above the selection with a mouse; below it on touch screens, where the system menu sits above.
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false
    const above = area.offsetTop + first.top - bar.offsetHeight - 6
    const below = area.offsetTop + last.top + last.height + 6
    const anchor = first.top === last.top ? (first.left + last.left) / 2 : first.left
    const room = Math.max(0, box.clientWidth - bar.offsetWidth)
    const left = Math.min(room, Math.max(0, area.offsetLeft + anchor - bar.offsetWidth / 2))
    const top = !coarse && above >= 0 ? above : below
    setFloatingAt((current) => (current?.top === top && current.left === left ? current : { top, left }))
  }, [showFloating, state.start, state.end, value])

  function format(action: InlineFormat) {
    apply(toggleInline(read(), action))
  }

  function block(action: BlockFormat) {
    apply(toggleBlock(read(), action))
  }

  function openEquation(display: boolean) {
    const draft = formulaAt(read(), display)
    setDialog({ kind: "equation", formula: { latex: draft.latex, display: draft.display }, editing: draft.editing })
  }

  function openLink() {
    const draft = linkDraftAt(read())
    setDialog({ kind: "link", text: draft.text, url: draft.url, editing: draft.editing })
  }

  /** Applies an edit once the dialog has closed and the text has its focus back. */
  function closeDialogWith(next: TextState | null) {
    setDialog(null)
    window.setTimeout(() => {
      if (next) apply(next)
      else textarea.current?.focus()
    }, 0)
  }

  function run(action: ShortcutAction) {
    if (action === "link") openLink()
    else if (action === "equation") openEquation(false)
    else format(action)
  }

  function focusToolbar() {
    const bar = showFloating ? floating.current : blockBar.current
    bar?.querySelector<HTMLElement>('[data-toolbar-item][tabindex="0"], [data-toolbar-item]')?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing) return
    if (event.altKey && event.key === "F10") {
      event.preventDefault()
      focusToolbar()
      return
    }
    if (event.key === "Escape" && showFloating) {
      setDismissedAt(selectionKey)
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.code === "KeyV") {
      plainPasteAt.current = Date.now()
      return
    }
    const shortcut = EDITOR_SHORTCUTS.find((entry) => matchesShortcut(event, entry.shortcut))
    if (shortcut) {
      event.preventDefault()
      run(shortcut.action)
      return
    }
    if (event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const next = continueList(read())
      if (next) {
        event.preventDefault()
        apply(next)
      }
    }
  }

  function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    if (Date.now() - plainPasteAt.current < PLAIN_PASTE_MS) return
    const html = event.clipboardData.getData("text/html")
    if (!html) return
    const current = read()
    if (codeBlockAt(current) || mathAt(current)) return
    const markdown = htmlToMarkdown(html)
    if (markdown === null) return
    event.preventDefault()
    apply(pasteBlocks(current, markdown))
  }

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
  }

  const hintId = `${id}-hint`
  return (
    <div
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
      className="bg-background focus-within:border-ring focus-within:ring-ring/50 rounded-lg border transition-[box-shadow,border-color] focus-within:ring-3"
    >
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        <BlockToolbar
          toolbarRef={blockBar}
          active={blocks}
          inCodeBlock={inCodeBlock}
          disabled={!writing}
          onBlock={block}
          onCodeBlock={() => apply(toggleCodeBlock(read()))}
          onDisplayEquation={() => openEquation(true)}
          onEscape={() => textarea.current?.focus()}
        />
        <div className="ms-auto flex items-center gap-1">
          <EditorViewSwitch view={view} views={views} onChange={setChosenView} />
          <MarkdownHelp />
        </div>
      </div>
      <div className={cn("grid", view === "split" && "md:grid-cols-2")}>
        <div ref={textBox} className={cn("relative", view === "preview" && "hidden")}>
          <label htmlFor={id} className="sr-only">
            {label}
          </label>
          <Textarea
            ref={textarea}
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onSelect={sync}
            onKeyUp={sync}
            onMouseUp={sync}
            onMouseDown={() => setDismissedAt(null)}
            onFocus={sync}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            rows={rows}
            disabled={disabled}
            spellCheck
            placeholder={t("placeholder")}
            aria-describedby={hintId}
            className="max-h-[70vh] min-h-40 resize-y rounded-none border-0 bg-transparent px-3 py-2.5 leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <p id={hintId} className="sr-only">
            {t("hint")}
          </p>
          {showFloating ? (
            <SelectionToolbar
              toolbarRef={floating}
              position={floatingAt}
              active={inline}
              linked={linked}
              quoted={blocks.has("quote")}
              onFormat={format}
              onLink={openLink}
              onQuote={() => block("quote")}
              onEquation={() => openEquation(false)}
              onEscape={() => {
                setDismissedAt(selectionKey)
                textarea.current?.focus()
              }}
            />
          ) : null}
        </div>
        {view !== "write" ? (
          <section
            aria-label={t("previewLabel")}
            className={cn("bg-muted/30 min-h-40 min-w-0 px-3 py-2.5", view === "split" && "md:border-s")}
          >
            {preview.trim() === "" ? (
              <p className="text-muted-foreground text-sm italic">{t("empty")}</p>
            ) : (
              <Markdown>{preview}</Markdown>
            )}
          </section>
        ) : null}
      </div>
      {dialog?.kind === "equation" ? (
        <EquationDialog
          initial={dialog.formula}
          editing={dialog.editing}
          returnFocus={textarea}
          onCancel={() => closeDialogWith(null)}
          onSubmit={(formula) => {
            const next = insertFormula(read(), formula)
            if (next) closeDialogWith(next)
            return next !== null
          }}
        />
      ) : null}
      {dialog?.kind === "link" ? (
        <LinkDialog
          initial={dialog}
          editing={dialog.editing}
          returnFocus={textarea}
          onCancel={() => closeDialogWith(null)}
          onSubmit={(text, url) => closeDialogWith(applyLink(read(), text, url))}
          onRemove={() => closeDialogWith(removeLink(read()))}
        />
      ) : null}
    </div>
  )
}

/** Pasted Markdown with several blocks starts and ends on lines of its own. */
function pasteBlocks(state: TextState, markdown: string): TextState {
  const { text, start, end } = state
  const multiline = markdown.includes("\n")
  const lineBefore = text.slice(text.lastIndexOf("\n", start - 1) + 1, start)
  const lineEnd = text.indexOf("\n", end)
  const lineAfter = text.slice(end, lineEnd === -1 ? text.length : lineEnd)
  const before = multiline && lineBefore.trim() !== "" ? "\n\n" : ""
  const after = multiline && lineAfter.trim() !== "" ? "\n\n" : ""
  const inserted = before + markdown + after
  const caret = start + before.length + markdown.length
  return { text: text.slice(0, start) + inserted + text.slice(end), start: caret, end: caret }
}

"use client"

import { useT } from "@ihsp/i18n"
import {
  Button,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBold,
  IconH2,
  IconH3,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconQuote,
  Input,
  Markdown as MarkdownView,
  Textarea,
  cn,
  parseMarkdown,
  type Icon,
} from "@ihsp/ui"
import { Link } from "@tiptap/extension-link"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Markdown } from "@tiptap/markdown"
import { EditorContent, useEditor, useEditorState, type Editor, type Extensions, type JSONContent } from "@tiptap/react"
import { StarterKit } from "@tiptap/starter-kit"
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react"

/** Only https:, mailto: and app-relative ("/…", not "//host") links are accepted; javascript:, data: and the rest are not. */
export function isSafeLinkUrl(url: string): boolean {
  const value = url.trim()
  return /^https:\/\/\S+$/i.test(value) || /^mailto:\S+$/i.test(value) || /^\/(?!\/)\S*$/.test(value)
}

/** The mdast of a Markdown text without source positions: what the readers render, compared structurally. */
function semanticTree(markdown: string): string {
  return JSON.stringify(parseMarkdown(markdown.trim()), (key, value: unknown) =>
    key === "position" ? undefined : value,
  )
}

/** mdast node types the visual editor (StarterKit, Link, Markdown) can hold; anything else is Markdown-only. */
const VISUAL_NODE_TYPES: Record<string, true> = {
  root: true,
  paragraph: true,
  text: true,
  heading: true,
  emphasis: true,
  strong: true,
  delete: true,
  inlineCode: true,
  code: true,
  blockquote: true,
  list: true,
  listItem: true,
  link: true,
  break: true,
  thematicBreak: true,
}

function onlyVisualNodes(node: unknown): boolean {
  if (!node || typeof node !== "object") return true
  const { type, children } = node as { type?: string; children?: unknown[] }
  if (type && !Object.hasOwn(VISUAL_NODE_TYPES, type)) return false
  return !Array.isArray(children) || children.every(onlyVisualNodes)
}

/**
 * True when the visual editor would write `markdown` back unchanged in meaning: it is parsed into the editor's own
 * document and serialized again, and both texts are parsed by the renderer the readers use and compared. Math,
 * tables, raw HTML and other things the editor has no node for make this false (the editor would drop or escape them).
 */
function survivesVisualEditor(editor: Editor, markdown: string): boolean {
  const manager = editor.markdown
  if (!manager || !onlyVisualNodes(parseMarkdown(markdown.trim()))) return false
  try {
    const node = editor.schema.nodeFromJSON(manager.parse(markdown))
    node.check()
    return semanticTree(manager.serialize(node.toJSON() as JSONContent)) === semanticTree(markdown)
  } catch {
    return false
  }
}

export type RichTextMode = "visual" | "markdown"

type Tool = { key: string; icon: Icon; active?: boolean; run: () => void; disabled?: boolean }

/**
 * A WYSIWYG field whose value is Markdown. The author edits formatted text; `onChange` receives Markdown, and an
 * outside `value` is loaded as Markdown (without echoing it back). Links are limited to safe schemes.
 *
 * A Markdown mode (text plus a live preview rendered like the readers see it) is one click away. A value the visual
 * editor cannot hold without changing it (formulas, tables, raw HTML) opens in the Markdown mode, and the visual mode
 * stays off for it, so editing never corrupts the stored text.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  maxLength,
  disabled = false,
  ariaLabel,
  extensions,
  toolbarExtra,
  minHeight = "12rem",
  id,
  invalid = false,
  describedBy,
  defaultMode = "visual",
  allowMarkdownMode = true,
  previewLabel,
}: {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  ariaLabel: string
  extensions?: Extensions
  toolbarExtra?: ReactNode
  minHeight?: string
  id?: string
  invalid?: boolean
  describedBy?: string
  /** The mode a value that the visual editor can hold opens in. */
  defaultMode?: RichTextMode
  /** Offer the Markdown mode (text and preview). Without it a value the visual editor would change is only warned about. */
  allowMarkdownMode?: boolean
  /** The accessible name of the preview region (default: the shared "Preview"). */
  previewLabel?: string
}) {
  const t = useT("richText")
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkError, setLinkError] = useState(false)
  const [mode, setMode] = useState<RichTextMode>(allowMarkdownMode ? defaultMode : "visual")
  // The last text the visual editor itself holds (typed or accepted); a value other than this came from outside
  // (null until the first one is checked).
  const lastEmitted = useRef<string | null>(null)
  const limit = useRef(maxLength)
  limit.current = maxLength

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        heading: { levels: [2, 3] },
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false, autolink: false, isAllowedUri: (url) => isSafeLinkUrl(url) }),
      Markdown,
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      ...(extensions ?? []),
    ],
    content: value,
    contentType: "markdown",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": ariaLabel,
        "aria-invalid": String(invalid),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      },
    },
    onUpdate: ({ editor: current }) => {
      const markdown = current.getMarkdown()
      if (limit.current !== undefined && markdown.length > limit.current) {
        current.commands.undo()
        return
      }
      lastEmitted.current = markdown
      onChange(markdown)
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(!disabled, false)
  }, [editor, disabled])

  // A value from outside that the visual editor would change on the way back is edited as Markdown.
  const lossy = useMemo(
    () =>
      editor && !editor.isDestroyed && value.trim() !== "" && value !== lastEmitted.current
        ? !survivesVisualEditor(editor, value)
        : false,
    [editor, value],
  )
  const markdownMode = allowMarkdownMode && (mode === "markdown" || lossy)

  // Load a value that came from outside; typing already produced the current one, so the caret stays put.
  useEffect(() => {
    if (!editor || editor.isDestroyed || markdownMode) return
    if (value === lastEmitted.current || value === editor.getMarkdown()) return
    lastEmitted.current = value
    editor.commands.setContent(value, { emitUpdate: false, contentType: "markdown" })
  }, [editor, value, markdownMode])

  useEffect(() => {
    if (lossy && allowMarkdownMode) setMode("markdown")
  }, [lossy, allowMarkdownMode])

  function chooseMode(next: RichTextMode) {
    if (next === "visual" && editor && !editor.isDestroyed) {
      lastEmitted.current = value
      editor.commands.setContent(value, { emitUpdate: false, contentType: "markdown" })
    }
    setMode(next)
  }

  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      h2: current?.isActive("heading", { level: 2 }) ?? false,
      h3: current?.isActive("heading", { level: 3 }) ?? false,
      bullet: current?.isActive("bulletList") ?? false,
      ordered: current?.isActive("orderedList") ?? false,
      quote: current?.isActive("blockquote") ?? false,
      link: current?.isActive("link") ?? false,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
      length: current?.getMarkdown().length ?? 0,
    }),
  })

  function openLink() {
    if (!editor) return
    setLinkUrl((editor.getAttributes("link").href as string | undefined) ?? "https://")
    setLinkError(false)
    setLinkOpen(true)
  }

  function applyLink(event: FormEvent) {
    event.preventDefault()
    if (!editor) return
    const url = linkUrl.trim()
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else if (isSafeLinkUrl(url)) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    } else {
      setLinkError(true)
      return
    }
    setLinkOpen(false)
  }

  const chain = () => editor?.chain().focus()
  const tools: Tool[] = [
    { key: "bold", icon: IconBold, active: state?.bold, run: () => chain()?.toggleBold().run() },
    { key: "italic", icon: IconItalic, active: state?.italic, run: () => chain()?.toggleItalic().run() },
    { key: "h2", icon: IconH2, active: state?.h2, run: () => chain()?.toggleHeading({ level: 2 }).run() },
    { key: "h3", icon: IconH3, active: state?.h3, run: () => chain()?.toggleHeading({ level: 3 }).run() },
    { key: "bullet", icon: IconList, active: state?.bullet, run: () => chain()?.toggleBulletList().run() },
    { key: "ordered", icon: IconListNumbers, active: state?.ordered, run: () => chain()?.toggleOrderedList().run() },
    { key: "quote", icon: IconQuote, active: state?.quote, run: () => chain()?.toggleBlockquote().run() },
    { key: "link", icon: IconLink, active: state?.link, run: openLink },
    { key: "undo", icon: IconArrowBackUp, disabled: !state?.canUndo, run: () => chain()?.undo().run() },
    { key: "redo", icon: IconArrowForwardUp, disabled: !state?.canRedo, run: () => chain()?.redo().run() },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="toolbar" aria-label={t("toolbar")} className="flex flex-wrap items-center gap-1">
          {markdownMode
            ? null
            : tools.map(({ key, icon: ToolIcon, active, run, disabled: off }) => (
                <Button
                  key={key}
                  type="button"
                  variant={active ? "secondary" : "outline"}
                  size="icon"
                  className="size-11 md:size-8"
                  aria-label={t(`tool.${key}`)}
                  aria-pressed={key === "undo" || key === "redo" ? undefined : (active ?? false)}
                  title={t(`tool.${key}`)}
                  disabled={disabled || !editor || off}
                  onClick={run}
                >
                  <ToolIcon aria-hidden />
                </Button>
              ))}
          {toolbarExtra}
        </div>
        {allowMarkdownMode ? (
          <div role="group" aria-label={t("mode.label")} className="flex gap-1">
            {(["visual", "markdown"] as const).map((option) => (
              <Button
                key={option}
                type="button"
                size="sm"
                variant={markdownMode === (option === "markdown") ? "default" : "outline"}
                aria-pressed={markdownMode === (option === "markdown")}
                className="min-h-11 rounded-full px-4 md:min-h-8"
                disabled={disabled || !editor || (option === "visual" && lossy)}
                onClick={() => chooseMode(option)}
              >
                {t(`mode.${option}`)}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {lossy ? (
        <p role="status" className="text-muted-foreground text-xs">
          {t(allowMarkdownMode ? "lossyNotice" : "lossyWarning")}
        </p>
      ) : null}
      {linkOpen && !markdownMode ? (
        <form className="flex flex-wrap items-center gap-2" onSubmit={applyLink}>
          <Input
            value={linkUrl}
            aria-label={t("linkUrl")}
            aria-invalid={linkError}
            inputMode="url"
            className="min-w-0 flex-1"
            onChange={(event) => {
              setLinkUrl(event.target.value)
              setLinkError(false)
            }}
          />
          <Button type="submit" size="sm">
            {t("linkApply")}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setLinkOpen(false)}>
            {t("linkCancel")}
          </Button>
          {linkError ? (
            <p role="alert" className="text-destructive w-full text-xs">
              {t("linkInvalid")}
            </p>
          ) : null}
        </form>
      ) : null}
      {markdownMode ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Textarea
            id={id}
            value={value}
            maxLength={maxLength}
            disabled={disabled}
            spellCheck
            aria-label={ariaLabel}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            placeholder={placeholder}
            className="min-h-64 min-w-0 font-mono"
            style={{ minHeight }}
            onChange={(event) => onChange(event.target.value)}
          />
          <section aria-label={previewLabel ?? t("preview")} className="min-h-24 min-w-0 rounded-md border p-3">
            {value.trim() === "" ? (
              <p className="text-muted-foreground text-sm italic">{t("previewEmpty")}</p>
            ) : (
              <MarkdownView>{value}</MarkdownView>
            )}
          </section>
        </div>
      ) : (
        <div
          className={cn(
            "border-input rounded-md border p-3",
            disabled && "opacity-60",
            "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[var(--rte-min)]",
            "[&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:font-semibold",
            "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5",
            "[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_a]:underline",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
            "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
          )}
          style={{ "--rte-min": minHeight } as React.CSSProperties}
        >
          <EditorContent editor={editor} />
        </div>
      )}
      {maxLength !== undefined ? (
        <p className="text-muted-foreground self-end text-xs" aria-live="polite">
          {markdownMode ? value.length : (state?.length ?? 0)} / {maxLength}
        </p>
      ) : null}
    </div>
  )
}

"use client"

import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { Link } from "@tiptap/extension-link"
import { Underline } from "@tiptap/extension-underline"
import { StarterKit } from "@tiptap/starter-kit"
import { EditorContent, Mark, mergeAttributes, useEditor, useEditorState } from "@tiptap/react"
import { useEffect } from "react"
import { toTelegramHtml } from "../utils/telegram-html"

/** Telegram spoiler (`<tg-spoiler>`). Tiptap has no built-in mark for it. */
const Spoiler = Mark.create({
  name: "spoiler",
  parseHTML() {
    return [{ tag: "tg-spoiler" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["tg-spoiler", mergeAttributes(HTMLAttributes), 0]
  },
})

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

/**
 * Rich text for one locale of a post body, limited to what Telegram renders: bold, italic, underline, strike, spoiler,
 * code, pre, link and blockquote. The value is Telegram HTML; the editor serializes its document back to that subset.
 */
export function BodyEditor({ id, value, onChange }: { id: string; value: string; onChange: (html: string) => void }) {
  const t = useT("botPosts.editor")
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        horizontalRule: false,
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: false, validate: isHttpUrl }),
      Spoiler,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: { id, role: "textbox", "aria-multiline": "true", "aria-label": t("label") },
    },
    onUpdate: ({ editor: current }) => onChange(toTelegramHtml(current.getJSON())),
  })

  // Load a value that came from outside (another locale, or a fresh post); keep the caret while typing.
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (toTelegramHtml(editor.getJSON()) !== value) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  const active = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive("bold") ?? false,
      italic: current?.isActive("italic") ?? false,
      underline: current?.isActive("underline") ?? false,
      strike: current?.isActive("strike") ?? false,
      spoiler: current?.isActive("spoiler") ?? false,
      code: current?.isActive("code") ?? false,
      codeBlock: current?.isActive("codeBlock") ?? false,
      blockquote: current?.isActive("blockquote") ?? false,
      link: current?.isActive("link") ?? false,
    }),
  })

  function setLink() {
    if (!editor) return
    const previous = editor.getAttributes("link").href as string | undefined
    const href = window.prompt(t("linkPrompt"), previous ?? "https://")
    if (href === null) return
    const trimmed = href.trim()
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    if (!isHttpUrl(trimmed)) return
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run()
  }

  const tools = [
    {
      key: "bold",
      label: t("bold"),
      text: "B",
      pressed: active?.bold,
      run: () => editor?.chain().focus().toggleBold().run(),
    },
    {
      key: "italic",
      label: t("italic"),
      text: "I",
      pressed: active?.italic,
      run: () => editor?.chain().focus().toggleItalic().run(),
    },
    {
      key: "underline",
      label: t("underline"),
      text: "U",
      pressed: active?.underline,
      run: () => editor?.chain().focus().toggleUnderline().run(),
    },
    {
      key: "strike",
      label: t("strike"),
      text: "S",
      pressed: active?.strike,
      run: () => editor?.chain().focus().toggleStrike().run(),
    },
    {
      key: "spoiler",
      label: t("spoiler"),
      text: "Sp",
      pressed: active?.spoiler,
      run: () => editor?.chain().focus().toggleMark("spoiler").run(),
    },
    {
      key: "code",
      label: t("code"),
      text: "</>",
      pressed: active?.code,
      run: () => editor?.chain().focus().toggleCode().run(),
    },
    {
      key: "pre",
      label: t("pre"),
      text: "Pre",
      pressed: active?.codeBlock,
      run: () => editor?.chain().focus().toggleCodeBlock().run(),
    },
    {
      key: "quote",
      label: t("quote"),
      text: "“”",
      pressed: active?.blockquote,
      run: () => editor?.chain().focus().toggleBlockquote().run(),
    },
    { key: "link", label: t("link"), text: "Link", pressed: active?.link, run: setLink },
  ]

  return (
    <div className="flex flex-col gap-2">
      <div role="toolbar" aria-label={t("formatting")} className="flex flex-wrap gap-1">
        {tools.map((tool) => (
          <Button
            key={tool.key}
            type="button"
            size="sm"
            variant={tool.pressed ? "secondary" : "outline"}
            aria-pressed={tool.pressed}
            aria-label={tool.label}
            title={tool.label}
            disabled={!editor}
            onClick={tool.run}
          >
            {tool.text}
          </Button>
        ))}
      </div>
      <div className="border-input rounded-md border p-2 [&_.ProseMirror]:min-h-32 [&_.ProseMirror]:outline-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

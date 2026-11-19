"use client"

import { kbLibrary, OpenUiBlock } from "@ihsp/features-core/openui"
import { useT } from "@ihsp/i18n"
import { Button } from "@ihsp/ui"
import { Node, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import { useState } from "react"
import { fence, parseSource } from "../openui-source"
import { BlockForm } from "./block-form"

const FENCE = /^```openui[ \t]*\n([\s\S]*?)\n?```[ \t]*(?:\n|$)/

function OpenUiBlockView({ node, updateAttributes, deleteNode, editor }: NodeViewProps) {
  const t = useT("kb.staff.block")
  const [editing, setEditing] = useState(false)
  const code = String(node.attrs.code ?? "")
  const parsed = parseSource(code)
  const editable = editor.isEditable
  return (
    <NodeViewWrapper className="my-2" contentEditable={false} data-openui-block="">
      {editing && parsed ? (
        <BlockForm
          kind={parsed.kind}
          initial={parsed.values}
          onCancel={() => setEditing(false)}
          onSubmit={(source) => {
            updateAttributes({ code: source })
            setEditing(false)
          }}
        />
      ) : (
        <OpenUiBlock code={code} library={kbLibrary} links="kb" />
      )}
      {editable && !editing ? (
        <div className="flex gap-2">
          {parsed ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)}>
              {t("edit")}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={() => deleteNode()}>
            {t("remove")}
          </Button>
        </div>
      ) : null}
    </NodeViewWrapper>
  )
}

/** An atomic block node for a ```openui fence: parsed and written back through @tiptap/markdown, drawn as a preview. */
export const OpenUiBlockNode = Node.create({
  name: "openUiBlock",
  priority: 1000,
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return { code: { default: "" } }
  },
  parseHTML() {
    return [{ tag: "div[data-openui-block]" }]
  },
  renderHTML() {
    return ["div", { "data-openui-block": "" }]
  },
  markdownTokenName: "openUiBlock",
  markdownTokenizer: {
    name: "openUiBlock",
    level: "block",
    start: (src: string) => src.search(/^```openui[ \t]*$/m),
    tokenize: (src: string) => {
      const match = FENCE.exec(src)
      return match ? { type: "openUiBlock", raw: match[0], code: match[1] ?? "" } : undefined
    },
  },
  parseMarkdown: (token) => ({ type: "openUiBlock", attrs: { code: String(token.code ?? "") } }),
  renderMarkdown: (node) => fence(String(node.attrs?.code ?? "")),
  addNodeView() {
    return ReactNodeViewRenderer(OpenUiBlockView)
  },
})

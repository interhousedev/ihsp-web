"use client"

import { useT } from "@ihsp/i18n"
import { IconH1, IconH2, IconH3, IconList, IconListNumbers, IconMath, IconSourceCode } from "@tabler/icons-react"
import { Fragment, type Ref } from "react"
import type { BlockFormat } from "../utils/markdown/block-format"
import { EditorToolbar } from "./editor-toolbar"
import { ToolbarButton } from "./toolbar-button"

const BLOCKS = [
  { format: "heading1", icon: IconH1 },
  { format: "heading2", icon: IconH2 },
  { format: "heading3", icon: IconH3 },
  { format: "bulletList", icon: IconList },
  { format: "orderedList", icon: IconListNumbers },
] as const satisfies readonly { format: BlockFormat; icon: unknown }[]

/** The toolbar above the text: headings, lists, code block and an equation on its own line. */
export function BlockToolbar({
  toolbarRef,
  active,
  inCodeBlock,
  disabled,
  onBlock,
  onCodeBlock,
  onDisplayEquation,
  onEscape,
}: {
  toolbarRef: Ref<HTMLDivElement>
  active: ReadonlySet<BlockFormat>
  inCodeBlock: boolean
  disabled?: boolean
  onBlock: (format: BlockFormat) => void
  onCodeBlock: () => void
  onDisplayEquation: () => void
  onEscape: () => void
}) {
  const t = useT("markdownEditor")
  return (
    <div ref={toolbarRef} className="order-last w-full min-w-0 overflow-x-auto md:order-none md:w-auto md:flex-1">
      <EditorToolbar label={t("toolbar")} onEscape={onEscape} className="gap-0 md:gap-0.5">
        {BLOCKS.map(({ format, icon }) => (
          <Fragment key={format}>
            {format === "bulletList" ? (
              <span aria-hidden className="bg-border mx-0.5 h-5 w-px shrink-0 md:mx-1" />
            ) : null}
            <ToolbarButton
              label={t(format)}
              icon={icon}
              pressed={active.has(format)}
              disabled={disabled}
              onPress={() => onBlock(format)}
            />
          </Fragment>
        ))}
        <span aria-hidden className="bg-border mx-0.5 h-5 w-px shrink-0 md:mx-1" />
        <ToolbarButton
          label={t("codeBlock")}
          icon={IconSourceCode}
          pressed={inCodeBlock}
          disabled={disabled}
          onPress={onCodeBlock}
        />
        <ToolbarButton label={t("displayEquation")} icon={IconMath} disabled={disabled} onPress={onDisplayEquation} />
      </EditorToolbar>
    </div>
  )
}

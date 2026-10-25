"use client"

import { useT } from "@ihsp/i18n"
import { Button, Kbd, Markdown, Popover, PopoverContent, PopoverTrigger } from "@ihsp/ui"
import { IconHelp } from "@ihsp/ui"
import { EDITOR_SHORTCUTS } from "../utils/editor-shortcuts"
import { shortcutLabel } from "../utils/shortcut-label"

/** The Markdown an author can type, each with how students see it (rendered by the same `Markdown`). */
const EXAMPLES: {
  key: string
  source: (word: string) => string
  rendered?: boolean
}[] = [
  { key: "bold", source: (word) => `**${word}**` },
  { key: "italic", source: (word) => `*${word}*` },
  { key: "underline", source: (word) => `<u>${word}</u>` },
  { key: "strike", source: (word) => `~~${word}~~` },
  { key: "code", source: (word) => `\`${word}\`` },
  { key: "spoiler", source: (word) => `||${word}||` },
  { key: "link", source: (word) => `[${word}](https://ihsu.uz)` },
  { key: "inlineMath", source: () => "$\\frac{a}{b}$" },
  { key: "displayMath", source: () => "$$ … $$", rendered: false },
  { key: "dollar", source: () => "\\$5" },
  { key: "heading", source: (word) => `## ${word}`, rendered: false },
  { key: "list", source: (word) => `- ${word}`, rendered: false },
  { key: "quote", source: (word) => `> ${word}`, rendered: false },
]

/** A "?" button with the formatting cheat sheet and the shortcuts. */
export function MarkdownHelp() {
  const t = useT("markdownEditor")
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("help")}
            className="size-11 shrink-0 md:pointer-fine:size-8"
          />
        }
      >
        <IconHelp aria-hidden className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto">
        <div className="flex flex-col gap-3 text-sm">
          <p className="font-medium">{t("helpTitle")}</p>
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th scope="col" className="pb-1 text-start font-medium">
                  {t("helpSyntax")}
                </th>
                <th scope="col" className="pb-1 text-start font-medium">
                  {t("helpResult")}
                </th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map((example) => {
                const word = t(`helpExamples.${example.key}`)
                const source = example.source(word)
                return (
                  <tr key={example.key} className="border-t">
                    <td className="py-1 pe-2 align-top">
                      <code className="font-mono break-all">{source}</code>
                    </td>
                    <td className="py-1 align-top">
                      {example.rendered === false ? word : <Markdown className="text-xs">{source}</Markdown>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="flex flex-col gap-1">
            <p className="font-medium">{t("shortcuts")}</p>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {EDITOR_SHORTCUTS.map(({ action, shortcut }) => (
                <li key={action} className="flex items-center justify-between gap-2">
                  <span>{t(action)}</span>
                  <Kbd>{shortcutLabel(shortcut)}</Kbd>
                </li>
              ))}
              <li className="flex items-center justify-between gap-2">
                <span>{t("toolbar")}</span>
                <Kbd>Alt+F10</Kbd>
              </li>
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

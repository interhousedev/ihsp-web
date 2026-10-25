import type { TextState } from "../features/step-editor/utils/markdown/text-state"

/** `"a «b» c"` is "a b c" with "b" selected; `"a‸b"` has the caret between a and b. */
export function marked(source: string): TextState {
  const caret = source.indexOf("‸")
  if (caret !== -1) return { text: source.replace("‸", ""), start: caret, end: caret }
  const start = source.indexOf("«")
  const withoutStart = source.replace("«", "")
  const end = withoutStart.indexOf("»")
  if (start === -1 || end === -1) throw new Error(`no selection in ${source}`)
  return { text: withoutStart.replace("»", ""), start, end }
}

/** The text with its selection marked like `marked` reads it. */
export function show(state: TextState): string {
  const { text, start, end } = state
  if (start === end) return `${text.slice(0, start)}‸${text.slice(start)}`
  return `${text.slice(0, start)}«${text.slice(start, end)}»${text.slice(end)}`
}

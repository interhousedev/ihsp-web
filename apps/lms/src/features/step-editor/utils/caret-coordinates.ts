/** Styles that decide where text wraps inside a textarea; the mirror copies them. */
const MIRRORED = [
  "boxSizing",
  "width",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "wordSpacing",
  "textAlign",
  "textTransform",
  "textIndent",
  "tabSize",
  "direction",
] as const

/**
 * Where the character at `position` is drawn inside the textarea (relative to its border box, scroll included), found
 * with a hidden mirror element that wraps text the same way. Styles are set through the CSSOM, which the CSP allows.
 */
export function caretCoordinates(
  textarea: HTMLTextAreaElement,
  position: number,
): { top: number; left: number; height: number } {
  const computed = window.getComputedStyle(textarea)
  const mirror = document.createElement("div")
  for (const property of MIRRORED) mirror.style[property] = computed[property]
  mirror.style.position = "absolute"
  mirror.style.visibility = "hidden"
  mirror.style.top = "0"
  mirror.style.left = "-9999px"
  mirror.style.whiteSpace = "pre-wrap"
  mirror.style.overflowWrap = "break-word"
  mirror.style.overflow = textarea.scrollHeight > textarea.clientHeight ? "scroll" : "hidden"
  mirror.textContent = textarea.value.slice(0, position)
  const marker = document.createElement("span")
  marker.textContent = textarea.value.slice(position, position + 1) || "."
  mirror.appendChild(marker)
  document.body.appendChild(mirror)
  const lineHeight = Number.parseFloat(computed.lineHeight) || Number.parseFloat(computed.fontSize) * 1.5 || 20
  const top = marker.offsetTop - textarea.scrollTop
  const left = marker.offsetLeft - textarea.scrollLeft
  mirror.remove()
  return { top, left, height: lineHeight }
}

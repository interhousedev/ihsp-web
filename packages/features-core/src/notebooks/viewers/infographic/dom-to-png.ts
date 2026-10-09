// Renders a DOM node to a PNG without a library: the node is cloned with its computed styles written inline, wrapped
// in `<svg><foreignObject>`, loaded as an image from a data URL and drawn on a canvas at 2x. Browsers that refuse
// (a tainted canvas, no canvas at all, as in happy-dom) make `renderNodeToPng` reject; the caller falls back to printing.

/** The properties that decide how an element looks. A shorter list keeps the SVG small; custom properties are not needed, they are already resolved. */
const STYLE_PROPERTIES = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "box-sizing",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "overflow-x",
  "overflow-y",
  "flex-direction",
  "flex-wrap",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "align-items",
  "align-self",
  "align-content",
  "justify-content",
  "justify-items",
  "justify-self",
  "place-items",
  "order",
  "row-gap",
  "column-gap",
  "grid-template-columns",
  "grid-template-rows",
  "grid-auto-flow",
  "grid-auto-rows",
  "grid-auto-columns",
  "grid-column-start",
  "grid-column-end",
  "grid-row-start",
  "grid-row-end",
  "background-color",
  "background-image",
  "color",
  "opacity",
  "box-shadow",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration-line",
  "text-overflow",
  "white-space",
  "word-break",
  "overflow-wrap",
  "list-style-type",
  "vertical-align",
  "transform",
  "transform-origin",
] as const

/** Writes the computed style of `source` and of everything below it as inline style on the matching nodes of `clone`. */
export function inlineComputedStyles(source: Element, clone: Element): void {
  const computed = getComputedStyle(source)
  const target = clone instanceof HTMLElement || clone instanceof SVGElement ? clone.style : null
  if (target) {
    for (const property of STYLE_PROPERTIES) {
      const value = computed.getPropertyValue(property)
      if (value) target.setProperty(property, value)
    }
  }
  const sourceChildren = Array.from(source.children)
  const cloneChildren = Array.from(clone.children)
  sourceChildren.forEach((child, index) => {
    const twin = cloneChildren[index]
    if (twin) inlineComputedStyles(child, twin)
  })
}

/** The node as XHTML text, which is what `foreignObject` needs (`XMLSerializer` writes the namespace of HTML elements). */
export function serializeNode(node: Element): string {
  return new XMLSerializer().serializeToString(node)
}

type SvgParts = {
  width: number
  height: number
  /** XHTML of the node to draw (see `serializeNode`). */
  markup: string
}

/** The SVG document that draws `markup` at `width` x `height` pixels. */
export function buildSvg({ width, height, markup }: SvgParts): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
    `<foreignObject x="0" y="0" width="${width}" height="${height}">${markup}</foreignObject>` +
    "</svg>"
  )
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function loadImage(source: string, timeoutMs: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const timer = setTimeout(() => reject(new Error("image-timeout")), timeoutMs)
    image.addEventListener(
      "load",
      () => {
        clearTimeout(timer)
        resolve(image)
      },
      { once: true },
    )
    image.addEventListener(
      "error",
      () => {
        clearTimeout(timer)
        reject(new Error("image-error"))
      },
      { once: true },
    )
    image.src = source
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // A canvas that was tainted by the SVG throws a SecurityError here.
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png-empty"))), "image/png")
    } catch (error) {
      reject(error instanceof Error ? error : new Error("png-failed"))
    }
  })
}

type PngOptions = {
  /** Size of the node in CSS pixels. */
  width: number
  height: number
  /** Pixel ratio of the picture (default 2). */
  scale?: number
  timeoutMs?: number
}

/** Draws `node` (not scaled by CSS) into a PNG. Rejects when the browser cannot do it. */
export async function renderNodeToPng(node: HTMLElement, options: PngOptions): Promise<Blob> {
  const { width, height, scale = 2, timeoutMs = 10_000 } = options
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const context = canvas.getContext("2d")
  if (!context) throw new Error("canvas-unsupported")

  const clone = node.cloneNode(true) as HTMLElement
  inlineComputedStyles(node, clone)
  const svg = buildSvg({ width, height, markup: serializeNode(clone) })
  const image = await loadImage(svgDataUrl(svg), timeoutMs)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvasToBlob(canvas)
}

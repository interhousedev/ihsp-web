// The CSS of the pdf.js text layer (the part of `pdf_viewer.css` that places the invisible, selectable text on top of
// the canvas), written flat so it needs no CSS nesting. It is injected once by the PDF reader as a <style> element
// (the CSP allows inline styles). The class names are ours; the custom properties are the ones pdf.js sets.

export const PDF_TEXT_LAYER_CSS = `
.ihsp-text-layer {
  position: absolute;
  inset: 0;
  overflow: clip;
  opacity: 1;
  text-align: initial;
  line-height: 1;
  text-size-adjust: none;
  forced-color-adjust: none;
  transform-origin: 0 0;
  caret-color: CanvasText;
  z-index: 1;
  color-scheme: only light;
  --min-font-size: 1;
  --text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
  --min-font-size-inv: calc(1 / var(--min-font-size));
}
.ihsp-text-layer :is(span, br) {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
.ihsp-text-layer > :not(.markedContent),
.ihsp-text-layer .markedContent span:not(.markedContent) {
  z-index: 1;
  --font-height: 0;
  font-size: calc(var(--text-scale-factor) * var(--font-height));
  --scale-x: 1;
  --rotate: 0deg;
  transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
}
.ihsp-text-layer .markedContent { display: contents; }
.ihsp-text-layer span[role="img"] { user-select: none; cursor: default; }
.ihsp-text-layer ::selection { background: rgba(0, 80, 255, 0.28); }
.ihsp-text-layer br::selection { background: transparent; }
.ihsp-text-layer .endOfContent {
  display: block;
  position: absolute;
  inset: 100% 0 0;
  z-index: 0;
  cursor: default;
  user-select: none;
}
.ihsp-text-layer.selecting .endOfContent { top: 0; }
@media (prefers-reduced-motion: reduce) {
  .ihsp-pdf-page canvas { transition: none; }
}
`

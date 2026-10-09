// Library (`library.ihsu.uz`): docs/reference/study-library.md § 9.3. One folder per area, each with its own `index.ts`
// and its own message file (`messages/<locale>/<area>.json`):
//   catalog (LIB-W1): home, browse, item pages, tags, rights, shelf button, report dialog, add to notebook, collections
//   lists/view (LIB-W1) and lists/editor (LIB-W3): reading lists
//   reader (LIB-W2): readers, annotations, My library
//   upload (LIB-W3): upload wizard, My uploads, photo picker, Markdown editor
//   manage (LIB-W4): librarian area, UniLibrary administration
// Heavy browser-only libraries (pdf.js, foliate-js) are imported dynamically inside the reader components.

export * from "./hooks/use-library-access"
export * from "./hooks/use-uni-library"
export * from "./utils/hrefs"
export * from "./messages"
export * from "./catalog"
export * from "./lists"
export * from "./reader"
export * from "./upload"
export * from "./manage"

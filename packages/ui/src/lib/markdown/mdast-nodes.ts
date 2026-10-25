/// <reference types="mdast-util-math" />
/// <reference types="mdast-util-to-hast" />
import type { Parent, PhrasingContent } from "mdast"

/** `||hidden text||`: rendered as a spoiler the reader reveals by a click. */
export interface Spoiler extends Parent {
  type: "spoiler"
  children: PhrasingContent[]
}

/** `<u>text</u>`: the only raw HTML the renderer understands, paired inside one paragraph. */
export interface Underline extends Parent {
  type: "underline"
  children: PhrasingContent[]
}

declare module "mdast" {
  interface PhrasingContentMap {
    spoiler: Spoiler
    underline: Underline
  }
  interface RootContentMap {
    spoiler: Spoiler
    underline: Underline
  }
}

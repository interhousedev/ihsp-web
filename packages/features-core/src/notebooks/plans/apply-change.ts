import type { PlanSlide } from "@ihsp/api"
import { addBullet, editBullet, editTitle, moveSlide, removeBullet, removeSlide } from "./plan-edit"
import type { SlideChange } from "./plan-slide-editor"

/** Applies one edit of the slide at `index` to the outline. */
export function applyChange(slides: readonly PlanSlide[], index: number, change: SlideChange): readonly PlanSlide[] {
  switch (change.kind) {
    case "title":
      return editTitle(slides, index, change.text)
    case "bullet":
      return editBullet(slides, index, change.bullet, change.text)
    case "addBullet":
      return addBullet(slides, index)
    case "removeBullet":
      return removeBullet(slides, index, change.bullet)
    case "move":
      return moveSlide(slides, index, change.by)
    case "remove":
      return removeSlide(slides, index)
  }
}

import { MAX_WHAT_IF, type WhatIfMark } from "./what-if"

/** Another mark fits while the list is under the planner's limit. */
export function canAddWhatIf(marks: WhatIfMark[]): boolean {
  return marks.length < MAX_WHAT_IF
}

/** The list with `mark` at the end; a full list stays as it is. Never changes `marks` in place. */
export function addWhatIf(marks: WhatIfMark[], mark: WhatIfMark): WhatIfMark[] {
  return canAddWhatIf(marks) ? [...marks, mark] : marks
}

/** The list without the mark at `index` (the same mark may be there twice, so the position is the identity). */
export function removeWhatIf(marks: WhatIfMark[], index: number): WhatIfMark[] {
  return marks.filter((_, position) => position !== index)
}

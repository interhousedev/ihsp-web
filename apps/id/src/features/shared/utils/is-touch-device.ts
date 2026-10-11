/** True on a phone or tablet (coarse pointer): a field is not focused automatically there, so the keyboard stays down. */
export function isTouchDevice(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
}

/**
 * Scrolls to the section named in the address (`#attendance`). The lesson loads after the first paint, so the browser
 * cannot do it on its own when the page opens from Today.
 */
export function scrollToHash(): void {
  const id = window.location.hash.slice(1)
  if (!id) return
  document.getElementById(id)?.scrollIntoView({ block: "start" })
}

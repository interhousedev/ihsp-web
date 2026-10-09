/** The smallest content scale; text below this is unreadable, so what still does not fit is cut off at the bottom. */
export const MIN_CONTENT_SCALE = 0.55

/**
 * The largest scale in `[min, 1]` for which `fits` is true, found by bisection (the content reflows when it is made
 * smaller and wider, so its height is not simply proportional). 1 when the content fits as it is, `min` when nothing does.
 */
export function findScale(fits: (scale: number) => boolean, min = MIN_CONTENT_SCALE, steps = 7): number {
  if (fits(1)) return 1
  if (!fits(min)) return min
  let low = min
  let high = 1
  for (let step = 0; step < steps; step += 1) {
    const middle = (low + high) / 2
    if (fits(middle)) low = middle
    else high = middle
  }
  return Math.floor(low * 100) / 100
}

/**
 * Measures how much the content of a canvas has to shrink to fit its fixed height. The content is tried at several
 * scales (scaled down and widened by the same factor, as it is drawn) and the original style is restored afterwards.
 * Returns 1 where nothing can be measured (a hidden canvas, happy-dom).
 */
export function measureContentScale(root: HTMLElement): number {
  const content = root.querySelector<HTMLElement>("[data-ig-content]")
  if (!content) return 1
  const { transform, width } = content.style
  const style = getComputedStyle(root)
  const available = root.clientHeight - parseFloat(style.paddingTop || "0") - parseFloat(style.paddingBottom || "0")
  if (!(available > 0)) return 1
  const fits = (scale: number) => {
    content.style.transform = scale < 1 ? `scale(${scale})` : ""
    content.style.width = scale < 1 ? `${100 / scale}%` : ""
    return content.scrollHeight * scale <= available + 0.5
  }
  const result = findScale(fits)
  content.style.transform = transform
  content.style.width = width
  return result
}

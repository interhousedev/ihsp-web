/**
 * Hero device catalog: one parametric shell that morphs between every device.
 *
 * Geometry, edge rings and palettes are adapted from react-mockframe
 * (https://github.com/mbdev3/react-mockframe, commit d1e7e27, MIT, Copyright (c) 2026
 * Mohammed Banani), whose frame styles are adapted from Marvel devices.css
 * (https://github.com/marvelapp/devices.css, MIT, Copyright (c) 2014 Marvelapp). The laptop's
 * geometry is our own measurement of the 16" MacBook Pro with PROLED XDR Display (see `MBP`).
 * Their per-device DOM is replaced here by one set of numbers per shape, so any
 * two devices can morph into each other. All lengths are the source's natural px.
 * No logos, no product names in the interface.
 */

export type DeviceId = "laptop" | "phone" | "foldable" | "tablet"
export type FoldPose = "closed" | "open"
export type ShellId = "laptop" | "phone" | "tablet" | "foldable-closed" | "foldable-open"
export type Finish = "light" | "dark"
/** Page skeleton drawn inside the screen (`components/frame/frame-skeleton.tsx`). */
export type SkeletonKind = "desktop" | "mobile" | "tablet"

export const DEVICE_IDS: readonly DeviceId[] = ["laptop", "phone", "foldable", "tablet"]

export function shellOf(device: DeviceId, pose: FoldPose): ShellId {
  return device === "foldable" ? `foldable-${pose}` : device
}

export interface Size {
  readonly width: number
  readonly height: number
}

export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export type ButtonId = "action" | "volume-up" | "volume-down" | "side" | "top-1" | "top-2" | "left-1"
export const BUTTON_IDS: readonly ButtonId[] = [
  "action",
  "volume-up",
  "volume-down",
  "side",
  "top-1",
  "top-2",
  "left-1",
]

export type ExtraId = "base" | "earpiece" | "spine" | "strips" | "hinge"

export interface ShellGeometry {
  /**
   * The page viewport inside the screen (CSS px of the iframe): readability over the device's real
   * points. Laptop and tablet stay ≥ 768 px wide (desktop layout, toasts on top) but small enough that
   * toasts render at ~0.9 of their size in the hero.
   */
  readonly viewport: Size
  /** The screen in the source's px. */
  readonly screen: Size
  /** Bezel around the screen: top, right, bottom, left. */
  readonly bezel: readonly [number, number, number, number]
  /** Corner radii (top-left, top-right, bottom-right, bottom-left). */
  readonly bodyRadius: readonly [number, number, number, number]
  readonly screenRadius: readonly [number, number, number, number]
  /** Everything the device occupies (base, feet, spine), the body placed at `body`. */
  readonly footprint: Size
  readonly body: { readonly x: number; readonly y: number }
  /** Notch, Dynamic Island or punch-hole: a rect in body coordinates, corner radii and the lens. */
  readonly cutout: Rect & {
    readonly radius: readonly [number, number, number, number]
    readonly lens: { readonly x: number; readonly y: number; readonly size: number }
  }
  /** Widths of the inset edge rings, outermost first (colours come from the finish). */
  readonly rings: readonly number[]
  /** A soft inner glow of the glass: blur and spread, or none. */
  readonly glass: { readonly blur: number; readonly spread: number } | null
  readonly buttons: Partial<Record<ButtonId, Rect>>
  readonly extras: readonly ExtraId[]
  readonly skeleton: SkeletonKind | "by-width"
}

const PHONE_RINGS = [0.667, 1.333, 2, 2.667, 3.333, 4, 4.333, 4.667, 5, 5.333, 5.667, 6.333]
const DUO_CLOSED_RINGS = [
  0.333, 0.667, 1, 1.333, 1.667, 2, 2.333, 2.667, 3, 3.333, 4, 4.667, 5.333, 6, 6.333, 7, 7.667, 8.333, 9, 9.667,
  10.667, 12, 13.667, 15.667,
]
const DUO_OPEN_RINGS = [
  0.667, 1.333, 1.667, 2, 2.333, 2.667, 3, 3.333, 3.667, 4, 4.333, 4.667, 5, 6, 7, 16.667, 17.333, 18,
]

/** Duo outer (closed) display and inner (open) display, from Apple's bezels at 1px = 1pt. */
const DUO_OUTER = { sw: 466, sh: 678, bx: 41.67, by: 32, spine: 11.67 }
const DUO_INNER = { sw: 951, sh: 669, bx: 41.33, by: 41.33 }

/**
 * 16" MacBook Pro with PROLED XDR Display, measured off Apple's straight-on product render and
 * scaled so the screen keeps the hero's 960 px width; the lid's tilt in the render is undone
 * from the panel's 3472×2266 aspect. The screen runs up to an even bezel as in Apple's
 * promo shots, the Dynamic Island floating in it. Bezels: top, sides, bottom.
 */
const MBP = { sw: 960, sh: 626.5, top: 12.6, side: 12.6, bottom: 20 }
const MBP_BODY = { width: MBP.sw + 2 * MBP.side, height: MBP.sh + MBP.top + MBP.bottom }

const r4 = (value: number) => [value, value, value, value] as const

export const SHELLS: Record<ShellId, ShellGeometry> = {
  // 16" MacBook Pro with PROLED XDR Display at 0.553 scale (1736×1133 pt → 960×626.5): no notch, a Dynamic
  // Island pill in the screen under an even bezel; slab base with scoop, feet.
  laptop: {
    viewport: { width: 900, height: 587 },
    screen: { width: MBP.sw, height: MBP.sh },
    bezel: [MBP.top, MBP.side, MBP.bottom, MBP.side],
    bodyRadius: [23, 23, 0, 0],
    screenRadius: r4(10.4),
    footprint: { width: MBP_BODY.width + 212, height: MBP_BODY.height + 31.7 + 7 },
    body: { x: 106, y: 0 },
    cutout: {
      x: (MBP_BODY.width - 34) / 2,
      y: MBP.top + 4,
      width: 34,
      height: 18,
      radius: r4(9),
      lens: { x: 25, y: 9, size: 4 },
    },
    rings: [0.35, 0.7, 1, 2.5, 6],
    glass: null,
    buttons: {},
    extras: ["base"],
    skeleton: "desktop",
  },
  // iPhone 18 Pro, 402×874 pt: titanium band rings, Dynamic Island, Action + volume left, side button right.
  phone: {
    viewport: { width: 402, height: 874 },
    screen: { width: 402, height: 874 },
    bezel: [15.67, 15.83, 15.67, 15.83],
    bodyRadius: r4(80.5),
    screenRadius: r4(63.6),
    footprint: { width: 433.66, height: 905.34 },
    body: { x: 0, y: 0 },
    cutout: { x: (433.66 - 94) / 2, y: 30, width: 94, height: 36, radius: r4(18), lens: { x: 76, y: 18, size: 10 } },
    rings: PHONE_RINGS,
    glass: { blur: 3, spread: 9.3 },
    buttons: {
      action: { x: -3, y: 186, width: 3, height: 41.67 },
      "volume-up": { x: -3, y: 258.33, width: 3, height: 67.67 },
      "volume-down": { x: -3, y: 344, width: 3, height: 67.67 },
      side: { x: 433.66, y: 281.67, width: 2.67, height: 107 },
    },
    extras: ["earpiece"],
    skeleton: "mobile",
  },
  // 13" iPad Pro in landscape at 0.496 scale (1376×1032 pt → 683×512); camera on the long (top) edge.
  tablet: {
    viewport: { width: 800, height: 600 },
    screen: { width: 683, height: 512 },
    bezel: r4(22.33),
    bodyRadius: r4(37.25),
    screenRadius: r4(14.4),
    footprint: { width: 727.66, height: 556.66 },
    body: { x: 0, y: 0 },
    cutout: { x: 727.66 * 0.47 - 2.5, y: 9.4, width: 5, height: 5, radius: r4(2.5), lens: { x: 2.5, y: 2.5, size: 5 } },
    rings: [0.5, 1, 1.75, 2.5],
    glass: { blur: 1, spread: 3 },
    buttons: {
      "left-1": { x: -1.5, y: 36, width: 1.5, height: 30.8 },
      "top-1": { x: 50.1, y: -1.5, width: 25.8, height: 1.5 },
      "top-2": { x: 81.4, y: -1.5, width: 25.8, height: 1.5 },
    },
    extras: [],
    skeleton: "tablet",
  },
  // Foldable, closed: the 466×678 pt outer display; the other half's spine peeks out on the hinge side.
  "foldable-closed": {
    viewport: { width: DUO_OUTER.sw, height: DUO_OUTER.sh },
    screen: { width: DUO_OUTER.sw, height: DUO_OUTER.sh },
    bezel: [16, 16, 16, 25.67 - DUO_OUTER.spine],
    bodyRadius: [4, 73.97, 73.97, 4],
    screenRadius: [7.97, 58.04, 58.04, 7.97],
    footprint: { width: DUO_OUTER.sw + DUO_OUTER.bx, height: DUO_OUTER.sh + DUO_OUTER.by },
    body: { x: DUO_OUTER.spine, y: 0 },
    cutout: {
      x: DUO_OUTER.sw + DUO_OUTER.bx - DUO_OUTER.spine - 45.67 - 36,
      y: 45.83,
      width: 36,
      height: 36,
      radius: r4(18),
      lens: { x: 18, y: 18, size: 12 },
    },
    rings: DUO_CLOSED_RINGS,
    glass: null,
    buttons: {
      side: { x: DUO_OUTER.sw + DUO_OUTER.bx - DUO_OUTER.spine, y: 202.33, width: 2.67, height: 112.67 },
      "top-1": { x: DUO_OUTER.sw + DUO_OUTER.bx - DUO_OUTER.spine - 207 - 65.67, y: -2.67, width: 65.67, height: 2.67 },
      "top-2": { x: DUO_OUTER.sw + DUO_OUTER.bx - DUO_OUTER.spine - 126 - 65.67, y: -2.67, width: 65.67, height: 2.67 },
    },
    extras: ["spine", "strips"],
    skeleton: "by-width",
  },
  // Foldable, open: the 951×669 pt inner display with hinge slots in the bezel. Its FaceTime camera sits
  // under the display (as in Apple's promo shots), so the cutout shrinks to nothing where the hole was.
  "foldable-open": {
    viewport: { width: DUO_INNER.sw, height: DUO_INNER.sh },
    screen: { width: DUO_INNER.sw, height: DUO_INNER.sh },
    bezel: r4(20.67),
    bodyRadius: r4(75.11),
    screenRadius: r4(53.49),
    footprint: { width: DUO_INNER.sw + DUO_INNER.bx, height: DUO_INNER.sh + DUO_INNER.by },
    body: { x: 0, y: 0 },
    cutout: {
      x: DUO_INNER.sw + DUO_INNER.bx - 278.2 - 14.75,
      y: 47.21 + 14.75,
      width: 0,
      height: 0,
      radius: r4(0),
      lens: { x: 0, y: 0, size: 0 },
    },
    rings: DUO_OPEN_RINGS,
    glass: null,
    buttons: {
      side: { x: DUO_INNER.sw + DUO_INNER.bx, y: 202.33, width: 2.67, height: 112.67 },
      "top-1": { x: DUO_INNER.sw + DUO_INNER.bx - 206.67 - 65.67, y: -2.67, width: 65.67, height: 2.67 },
      "top-2": { x: DUO_INNER.sw + DUO_INNER.bx - 125.67 - 65.67, y: -2.67, width: 65.67, height: 2.67 },
    },
    extras: ["hinge"],
    skeleton: "by-width",
  },
}

/** The body's outer size: screen plus bezels. */
export function bodySize(shell: ShellGeometry): Size {
  const [top, right, bottom, left] = shell.bezel
  return { width: shell.screen.width + left + right, height: shell.screen.height + top + bottom }
}

/** Which skeleton a shell shows: the foldable follows its width, like a responsive page. */
export function skeletonOf(shell: ShellId): SkeletonKind {
  const kind = SHELLS[shell].skeleton
  if (kind !== "by-width") return kind
  return SHELLS[shell].viewport.width < 768 ? "mobile" : "tablet"
}

/* ---------------------------------------------------------------- finishes */

export interface FinishPalette {
  /** Ring colours, one per ring of the shell, outermost first. */
  readonly rings: readonly string[]
  readonly glass: string
  readonly bezel: string
  /** Side buttons. */
  readonly button: string
  /** Laptop base, scoop and feet; foldable spine, strips and hinge. */
  readonly parts?: Readonly<Record<string, string>>
}

const PHONE_BLACK = [
  "oklch(0.188 0.003 326)",
  "oklch(0.197 0.003 326)",
  "oklch(0.217 0.005 326)",
  "oklch(0.247 0.005 326)",
  "oklch(0.296 0.005 326)",
  "oklch(0.379 0.006 326)",
  "oklch(0.482 0.006 326)",
  "oklch(0.552 0.005 337)",
  "oklch(0.552 0.006 326)",
  "oklch(0.420 0.006 326)",
  "oklch(0.267 0.005 326)",
  "oklch(0.253 0.002 326)",
]
const PHONE_SILVER = [
  "oklch(0.552 0 0)",
  "oklch(0.640 0 0)",
  "oklch(0.719 0 0)",
  "oklch(0.786 0 0)",
  "oklch(0.836 0 0)",
  "oklch(0.879 0 0)",
  "oklch(0.913 0 0)",
  "oklch(0.931 0 0)",
  "oklch(0.931 0 0)",
  "oklch(0.870 0 0)",
  "oklch(0.738 0 0)",
  "oklch(0.569 0 0)",
]
const DUO_NIGHT_K = [
  "oklch(0.447 0.027 261)",
  "oklch(0.295 0.026 260)",
  "oklch(0.207 0.020 258)",
  "oklch(0.242 0.021 261)",
  "oklch(0.357 0.029 258)",
  "oklch(0.854 0.054 257)",
  "oklch(0.810 0.063 258)",
  "oklch(0.731 0.061 257)",
  "oklch(0.641 0.056 257)",
  "oklch(0.550 0.049 256)",
  "oklch(0.445 0.043 257)",
  "oklch(0.341 0.033 256)",
  "oklch(0.266 0.024 256)",
  "oklch(0.220 0.020 258)",
  "oklch(0.197 0.017 253)",
  "oklch(0.106 0.008 260)",
  "oklch(0.069 0.008 284)",
  "oklch(0.243 0.016 264)",
  "oklch(0.222 0.013 264)",
  "oklch(0.187 0.011 268)",
  "oklch(0.158 0.007 258)",
  "oklch(0.114 0.004 245)",
  "oklch(0.000 0 0)",
  "oklch(0.000 0 0)",
]
const DUO_WHITE_K = [
  "oklch(0.534 0 0)",
  "oklch(0.492 0 0)",
  "oklch(0.386 0.003 107)",
  "oklch(0.340 0.003 107)",
  "oklch(0.371 0.005 92)",
  "oklch(0.525 0.009 81)",
  "oklch(0.979 0 0)",
  "oklch(0.974 0 0)",
  "oklch(0.961 0 0)",
  "oklch(0.943 0.003 85)",
  "oklch(0.910 0.003 85)",
  "oklch(0.860 0.007 97)",
  "oklch(0.782 0.010 94)",
  "oklch(0.696 0.012 90)",
  "oklch(0.631 0.011 88)",
  "oklch(0.510 0.008 89)",
  "oklch(0.364 0.002 68)",
  "oklch(0.230 0.008 264)",
  "oklch(0.367 0.020 266)",
  "oklch(0.279 0.012 258)",
  "oklch(0.229 0.009 256)",
  "oklch(0.159 0.005 264)",
  "oklch(0.067 0 0)",
  "oklch(0.000 0 0)",
]
const DUO_NIGHT_O = [
  "oklch(0.470 0.040 263)",
  "oklch(0.221 0.026 261)",
  "oklch(0.209 0.030 264)",
  "oklch(0.305 0.037 263)",
  "oklch(0.445 0.047 263)",
  "oklch(0.560 0.053 261)",
  "oklch(0.658 0.063 263)",
  "oklch(0.752 0.067 263)",
  "oklch(0.581 0.054 262)",
  "oklch(0.293 0.034 263)",
  "oklch(0.127 0.019 253)",
  "oklch(0.199 0.005 248)",
  "oklch(0.268 0.004 264)",
  "oklch(0.384 0.003 286)",
  "oklch(0.378 0.002 248)",
  "oklch(0.306 0.004 286)",
  "oklch(0.286 0.004 286)",
  "oklch(0.195 0.003 248)",
]
const DUO_WHITE_O = [
  "oklch(0.553 0.007 85)",
  "oklch(0.416 0.010 92)",
  "oklch(0.485 0.010 92)",
  "oklch(0.600 0.009 92)",
  "oklch(0.760 0.010 94)",
  "oklch(0.870 0.008 91)",
  "oklch(0.931 0.007 89)",
  "oklch(0.967 0.005 95)",
  "oklch(0.885 0.008 91)",
  "oklch(0.598 0.013 85)",
  "oklch(0.248 0.010 89)",
  "oklch(0.230 0.002 248)",
  "oklch(0.336 0.002 248)",
  "oklch(0.420 0.004 265)",
  "oklch(0.405 0.002 248)",
  "oklch(0.328 0.002 248)",
  "oklch(0.309 0.002 248)",
  "oklch(0.208 0.003 248)",
]

const sideButton = (stops: readonly string[]) =>
  `linear-gradient(to right, ${stops[0]} 0%, ${stops[2]} 25%, ${stops[3]} 50%, ${stops[5]} 68%, ${stops[7]} 80%, ${stops[9]} 100%)`

const DUO_NIGHT_PARTS = {
  spine:
    "linear-gradient(to right, oklch(0.327 0.032 260) 0.33px, oklch(0.253 0.034 265) 1px, oklch(0.447 0.043 261) 1.67px, oklch(0.661 0.055 258) 2.33px, oklch(0.586 0.050 260) 3px, oklch(0.411 0.035 261) 3.67px, oklch(0.328 0.033 263) 4.33px, oklch(0.277 0.030 265) 5px, oklch(0.256 0.026 265) 5.67px, oklch(0.255 0.025 261) 6.33px, oklch(0.252 0.024 264) 7px, oklch(0.247 0.025 264) 7.67px, oklch(0.252 0.024 264) 8.33px, oklch(0.251 0.025 261) 9px, oklch(0.255 0.025 261) 9.67px, oklch(0.263 0.025 261) 10.33px, oklch(0.263 0.025 261) 11px, oklch(0.307 0.031 258) 11.67px)",
  stripLeft:
    "linear-gradient(to right, oklch(0.306 0.029 257) 0.33px, oklch(0.709 0.060 257) 1px, oklch(0.302 0.027 258) 1.67px, oklch(0.096 0.009 259) 2.33px, oklch(0.082 0.008 241) 3px, oklch(0.063 0.013 234) 3.67px, oklch(0.063 0.013 234) 4.33px, oklch(0.061 0.010 195) 5px, oklch(0.134 0.005 262) 5.67px, oklch(0.264 0.018 266) 6.33px, oklch(0.204 0.013 264) 7px, oklch(0.177 0.009 264) 7.67px, oklch(0.155 0.007 271) 8.33px, oklch(0.134 0.005 262) 9px, oklch(0.108 0.004 286) 9.67px, oklch(0.067 0 0) 10.33px, oklch(0.000 0 0) 11px)",
  stripRight:
    "linear-gradient(to left, oklch(0.436 0.026 259) 0.33px, oklch(0.167 0.012 254) 1px, oklch(0.121 0.004 245) 1.67px, oklch(0.099 0.008 285) 2.33px, oklch(0.290 0.025 256) 3px, oklch(0.441 0.042 256) 3.67px, oklch(0.536 0.049 256) 4.33px, oklch(0.676 0.058 256) 5px, oklch(0.817 0.058 257) 5.67px, oklch(0.255 0.017 260) 6.33px, oklch(0.068 0.021 254) 7px, oklch(0.181 0.011 261) 7.67px, oklch(0.255 0.017 260) 8.33px, oklch(0.199 0.011 261) 9px, oklch(0.173 0.009 264) 9.67px, oklch(0.153 0.007 258) 10.33px, oklch(0.128 0.006 262) 11px, oklch(0.098 0.004 286) 11.67px, oklch(0.067 0 0) 12.33px, oklch(0.000 0 0) 13px)",
  stripBottom:
    "linear-gradient(to top, oklch(0.421 0.025 258) 0.33px, oklch(0.233 0.015 257) 1px, oklch(0.186 0.009 264) 1.67px, oklch(0.145 0.007 270) 2.33px, oklch(0.658 0.054 258) 3px, oklch(0.712 0.060 257) 3.67px, oklch(0.541 0.050 258) 4.33px, oklch(0.413 0.040 258) 5px, oklch(0.342 0.033 259) 5.67px, oklch(0.242 0.019 258) 6.33px, oklch(0.155 0.007 271) 7px, oklch(0.187 0.011 268) 7.67px, oklch(0.247 0.016 264) 8.33px, oklch(0.199 0.011 261) 9px, oklch(0.173 0.009 264) 9.67px, oklch(0.149 0.007 258) 10.33px, oklch(0.128 0.003 246) 11px, oklch(0.094 0.004 196) 11.67px, oklch(0.067 0 0) 12.33px, oklch(0.000 0 0) 13px)",
  hingeSlot: "oklch(0.239 0.002 248)",
  hingeHighlight: "oklch(0.894 0.039 262)",
  openBezel: "oklch(0.097 0 0)",
} as const

const DUO_WHITE_PARTS = {
  spine:
    "linear-gradient(to right, oklch(0.487 0.003 49) 0.33px, oklch(0.435 0.008 89) 1px, oklch(0.587 0.011 88) 1.67px, oklch(0.814 0.010 87) 2.33px, oklch(0.667 0.011 87) 3px, oklch(0.492 0.013 95) 3.67px, oklch(0.457 0.012 88) 4.33px, oklch(0.457 0.013 90) 5px, oklch(0.472 0.014 85) 5.67px, oklch(0.528 0.014 92) 6.33px, oklch(0.593 0.015 93) 7px, oklch(0.663 0.015 93) 7.67px, oklch(0.725 0.013 92) 8.33px, oklch(0.770 0.013 92) 9px, oklch(0.795 0.012 90) 9.67px, oklch(0.792 0.010 87) 10.33px, oklch(0.751 0.010 87) 11px, oklch(0.603 0.008 97) 11.67px)",
  stripLeft:
    "linear-gradient(to right, oklch(0.421 0.004 85) 0.33px, oklch(0.682 0.009 99) 1px, oklch(0.443 0.007 85) 1.67px, oklch(0.864 0.006 85) 2.33px, oklch(0.928 0.003 85) 3px, oklch(0.937 0.003 85) 3.67px, oklch(0.943 0.003 106) 4.33px, oklch(0.943 0.003 85) 5px, oklch(0.295 0.002 326) 5.67px, oklch(0.389 0.020 263) 6.33px, oklch(0.289 0.013 267) 7px, oklch(0.247 0.010 261) 7.67px, oklch(0.209 0.009 264) 8.33px, oklch(0.168 0.004 264) 9px, oklch(0.133 0.003 246) 9.67px, oklch(0.086 0.006 285) 10.33px, oklch(0.000 0 0) 11px)",
  stripRight:
    "linear-gradient(to left, oklch(0.364 0.002 68) 0.33px, oklch(0.252 0.004 85) 1px, oklch(0.314 0.008 85) 1.67px, oklch(0.388 0.008 75) 2.33px, oklch(0.644 0.011 87) 3px, oklch(0.821 0.009 85) 3.67px, oklch(0.873 0.007 89) 4.33px, oklch(0.919 0.005 95) 5px, oklch(0.955 0.003 85) 5.67px, oklch(0.544 0.011 73) 6.33px, oklch(0.434 0.008 68) 7px, oklch(0.329 0.008 264) 7.67px, oklch(0.371 0.020 266) 8.33px, oklch(0.281 0.014 267) 9px, oklch(0.238 0.011 261) 9.67px, oklch(0.200 0.009 264) 10.33px, oklch(0.164 0.005 264) 11px, oklch(0.128 0.003 246) 11.67px, oklch(0.081 0.006 196) 12.33px, oklch(0.000 0 0) 13px)",
  stripBottom:
    "linear-gradient(to top, oklch(0.372 0.002 68) 0.33px, oklch(0.274 0.005 68) 1px, oklch(0.331 0.007 68) 1.67px, oklch(0.409 0.011 68) 2.33px, oklch(0.855 0.005 78) 3px, oklch(0.919 0.004 91) 3.67px, oklch(0.864 0.006 85) 4.33px, oklch(0.777 0.010 87) 5px, oklch(0.663 0.012 90) 5.67px, oklch(0.500 0.008 89) 6.33px, oklch(0.391 0.004 85) 7px, oklch(0.239 0.008 264) 7.67px, oklch(0.355 0.017 262) 8.33px, oklch(0.276 0.012 264) 9px, oklch(0.234 0.011 261) 9.67px, oklch(0.192 0.008 274) 10.33px, oklch(0.154 0.005 264) 11px, oklch(0.116 0.003 286) 11.67px, oklch(0.067 0 0) 12.33px, oklch(0.000 0 0) 13px)",
  hingeSlot: "oklch(0.251 0.002 248)",
  hingeHighlight: "oklch(0.891 0 0)",
  openBezel: "oklch(0.107 0 0)",
} as const

const DUO_NIGHT_BUTTON =
  "linear-gradient(to right, oklch(0.309 0.030 253) 6.2%, oklch(0.349 0.036 257) 18.8%, oklch(0.371 0.041 257) 31.2%, oklch(0.394 0.044 257) 43.8%, oklch(0.423 0.048 257) 56.2%, oklch(0.479 0.047 254) 68.8%, oklch(0.775 0.056 260) 81.2%, oklch(0.126 0.018 250) 93.8%)"
const DUO_WHITE_BUTTON =
  "linear-gradient(to right, oklch(0.603 0.008 89) 6.2%, oklch(0.683 0.015 89) 18.8%, oklch(0.712 0.015 93) 31.2%, oklch(0.738 0.015 93) 43.8%, oklch(0.767 0.013 92) 56.2%, oklch(0.848 0.010 94) 68.8%, oklch(1.000 0 0) 81.2%, oklch(0.373 0.014 85) 93.8%)"

/** Light theme: silver / Star White; dark theme: Space Black / Black / Night Sky. */
export const FINISHES: Record<ShellId, Record<Finish, FinishPalette>> = {
  laptop: {
    dark: {
      rings: [
        "oklch(0.343 0.004 326)",
        "oklch(0.595 0.004 326)",
        "oklch(0.503 0.005 315)",
        "oklch(0.375 0.006 315)",
        "oklch(0.256 0 0)",
      ],
      glass: "transparent",
      bezel: "oklch(0.000 0 0)",
      button: "transparent",
      parts: {
        base: "linear-gradient(to bottom, oklch(0.766 0.005 315) 0, oklch(0.513 0.005 315) 0.7px, oklch(0.474 0.005 315) 20%, oklch(0.481 0.005 315) 42%, oklch(0.419 0.006 315) 58%, oklch(0.352 0.006 315) 68%, oklch(0.280 0.005 326) 78%, oklch(0.234 0.005 326) 86%, oklch(0.280 0.006 315) 94%, oklch(0.359 0.006 315) 100%)",
        scoop:
          "linear-gradient(to bottom, oklch(0.706 0.007 318) 0%, oklch(0.646 0.005 315) 45%, oklch(0.555 0.005 315) 100%)",
        scoopTop: "oklch(0.706 0.007 318)",
        foot: "linear-gradient(to bottom, oklch(0.221 0.005 326) 0%, oklch(0.344 0.006 315) 70%, oklch(0.280 0.006 315) 100%)",
      },
    },
    light: {
      rings: [
        "oklch(0.885 0.003 265)",
        "oklch(0.782 0.003 265)",
        "oklch(0.689 0.003 265)",
        "oklch(0.696 0.003 265)",
        "oklch(0.256 0 0)",
      ],
      glass: "transparent",
      bezel: "oklch(0.000 0 0)",
      button: "transparent",
      parts: {
        base: "linear-gradient(to bottom, oklch(0.958 0.003 265) 0, oklch(0.879 0.003 265) 0.7px, oklch(0.860 0.003 265) 20%, oklch(0.854 0.003 265) 42%, oklch(0.820 0.003 265) 55%, oklch(0.735 0.003 265) 64%, oklch(0.650 0.003 265) 74%, oklch(0.620 0.003 265) 84%, oklch(0.706 0.003 265) 92%, oklch(0.839 0.003 265) 100%)",
        scoop:
          "linear-gradient(to bottom, oklch(0.928 0.003 265) 0%, oklch(0.943 0 0) 50%, oklch(0.967 0.003 265) 100%)",
        scoopTop: "oklch(0.928 0.003 265)",
        foot: "linear-gradient(to bottom, oklch(0.541 0.003 265) 0%, oklch(0.718 0.003 265) 70%, oklch(0.650 0.003 265) 100%)",
      },
    },
  },
  phone: {
    dark: { rings: PHONE_BLACK, glass: "oklch(0.360 0 0)", bezel: "oklch(0.000 0 0)", button: sideButton(PHONE_BLACK) },
    light: {
      rings: PHONE_SILVER,
      glass: "oklch(0.360 0 0)",
      bezel: "oklch(0.000 0 0)",
      button: sideButton(PHONE_SILVER),
    },
  },
  tablet: {
    dark: {
      rings: ["oklch(0.405 0.007 308)", "oklch(0.544 0.008 341)", "oklch(0.342 0.007 346)", "oklch(0.292 0.006 315)"],
      glass: "oklch(0.231 0 0)",
      bezel: "oklch(0.000 0 0)",
      button:
        "linear-gradient(to right, oklch(0.368 0.005 338) 0%, oklch(0.300 0.006 315) 15%, oklch(0.446 0.008 304) 35%, oklch(0.569 0.011 293) 55%, oklch(0.668 0.007 326) 78%, oklch(0.316 0.006 315) 100%)",
    },
    light: {
      rings: ["oklch(0.702 0 0)", "oklch(0.848 0 0)", "oklch(0.673 0 0)", "oklch(0.606 0 0)"],
      glass: "oklch(0.301 0 0)",
      bezel: "oklch(0.000 0 0)",
      button:
        "linear-gradient(to right, oklch(0.646 0 0) 0%, oklch(0.606 0 0) 15%, oklch(0.763 0 0) 35%, oklch(0.810 0 0) 55%, oklch(0.820 0 0) 78%, oklch(0.506 0.002 248) 100%)",
    },
  },
  "foldable-closed": {
    dark: {
      rings: DUO_NIGHT_K,
      glass: "transparent",
      bezel: "oklch(0.000 0 0)",
      button: DUO_NIGHT_BUTTON,
      parts: DUO_NIGHT_PARTS,
    },
    light: {
      rings: DUO_WHITE_K,
      glass: "transparent",
      bezel: "oklch(0.000 0 0)",
      button: DUO_WHITE_BUTTON,
      parts: DUO_WHITE_PARTS,
    },
  },
  "foldable-open": {
    dark: {
      rings: DUO_NIGHT_O,
      glass: "transparent",
      bezel: DUO_NIGHT_PARTS.openBezel,
      button: DUO_NIGHT_BUTTON,
      parts: DUO_NIGHT_PARTS,
    },
    light: {
      rings: DUO_WHITE_O,
      glass: "transparent",
      bezel: DUO_WHITE_PARTS.openBezel,
      button: DUO_WHITE_BUTTON,
      parts: DUO_WHITE_PARTS,
    },
  },
}

/** Every shell renders the same number of rings, so CSS can interpolate the shadow lists pairwise. */
export const RING_SLOTS = 24

/**
 * The bezel's edge as one inset box-shadow list of exactly RING_SLOTS + 1 entries (rings, then
 * the glass glow). Missing rings repeat the last width in transparent, which CSS interpolates
 * smoothly into the next shell's rings.
 */
export function ringShadow(shell: ShellId, finish: Finish): string {
  const geometry = SHELLS[shell]
  const palette = FINISHES[shell][finish]
  const last = geometry.rings.at(-1) ?? 0
  const rings: string[] = []
  for (let index = 0; index < RING_SLOTS; index += 1) {
    const width = geometry.rings[index]
    rings.push(
      width === undefined ? `inset 0 0 0 ${last}px transparent` : `inset 0 0 0 ${width}px ${palette.rings[index]}`,
    )
  }
  const glass = geometry.glass
  rings.push(glass ? `inset 0 0 ${glass.blur}px ${glass.spread}px ${palette.glass}` : "inset 0 0 0 0 transparent")
  return rings.join(", ")
}

/* ---------------------------------------------------------------- fold */

/**
 * Fold animation from react-mockframe's iPhone Duo renderer: two 3D leaves hinged in the
 * middle under the perspective fitted to Apple's half-open render (~29.8° per half at
 * ~2139 px). Closing swings the left leaf over; its back is the outer display.
 */
export const FOLD = {
  durationMs: 900,
  easing: "cubic-bezier(0.45, 0, 0.2, 1)",
  perspective: 2139,
  /** The hinge's x in each pose's footprint. */
  hinge: { closed: DUO_OUTER.spine, open: (DUO_INNER.sw + DUO_INNER.bx) / 2 },
  /** Left leaf angle per pose (the right leaf stays flat). */
  leftAngle: { closed: 180, open: 0 },
  outer: DUO_OUTER,
  inner: DUO_INNER,
} as const

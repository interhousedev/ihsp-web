"use client"

import type { BadgeIcon, BadgeShape } from "@ihsp/api"
import { IconBolt, IconBook, IconBrain, IconCheck, IconCrown, IconFlame, IconHeart, IconMedal, IconRocket, IconStar, IconTarget, IconTrophy, type Icon } from "@ihsp/ui"
import type { Design } from "../api"

export const ICON_COMPONENTS: Record<BadgeIcon, Icon> = {
  star: IconStar,
  trophy: IconTrophy,
  medal: IconMedal,
  flame: IconFlame,
  book: IconBook,
  rocket: IconRocket,
  bolt: IconBolt,
  heart: IconHeart,
  crown: IconCrown,
  target: IconTarget,
  brain: IconBrain,
  check: IconCheck,
}

/** Outlines in a 100×100 box. */
const SHAPE_PATHS: Record<BadgeShape, string> = {
  circle: "M50 4a46 46 0 1 1 0 92a46 46 0 1 1 0-92z",
  shield: "M50 4L90 18V48C90 72 72 88 50 96C28 88 10 72 10 48V18Z",
  hexagon: "M50 4L90 27V73L50 96L10 73V27Z",
  star: "M50 3L61 20L81 15L80 36L97 47L82 61L88 81L67 81L56 97L44 81L23 84L22 63L4 52L19 38L15 17L36 20Z",
}

/** A badge drawn from its design: the shape filled with the colour and the icon on top. */
export function BadgeMedal({ design, size = 48 }: { design: Design; size?: number }) {
  const Glyph = ICON_COMPONENTS[design.icon]
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full drop-shadow-sm">
        <path d={SHAPE_PATHS[design.shape]} fill={design.color} />
        <path d={SHAPE_PATHS[design.shape]} fill="none" stroke="white" strokeOpacity={0.55} strokeWidth={4} />
      </svg>
      <Glyph className="relative text-white" size={size * 0.44} stroke={2} />
    </span>
  )
}

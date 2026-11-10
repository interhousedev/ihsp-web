"use client"

import { SlideBullets } from "../slide-bullets"
import type { LayoutProps } from "./layout-props"
import { SlidePicture } from "./slide-image"

/** A picture on one side and the heading with its points on the other. */
export function ImageSideSlide({ slide, tier, hint, side }: LayoutProps & { side: "left" | "right" }) {
  const text = (
    <div className="flex min-w-0 flex-col gap-[2cqw]">
      <h2 className="border-primary border-b-[0.5cqw] pb-[1.2cqw] text-[length:4.4cqw] leading-tight font-bold [overflow-wrap:anywhere]">
        {slide.title}
      </h2>
      <SlideBullets bullets={slide.bullets ?? []} tier={tier} />
      {hint}
    </div>
  )
  const picture = <SlidePicture image={slide.image} />
  return (
    <div className="grid h-full grid-cols-2 gap-[3cqw] p-[4cqw]">
      {side === "left" ? picture : text}
      {side === "left" ? text : picture}
    </div>
  )
}

export function ImageLeftSlide(props: LayoutProps) {
  return <ImageSideSlide {...props} side="left" />
}

export function ImageRightSlide(props: LayoutProps) {
  return <ImageSideSlide {...props} side="right" />
}

/** The picture fills the slide; the title sits on a dark band at the bottom. */
export function FullImageSlide({ slide, hint }: LayoutProps) {
  return (
    <div className="relative h-full">
      <SlidePicture image={slide.image} overlay />
      <div className="absolute inset-x-0 top-0 bg-black/55 px-[4cqw] py-[2cqw] text-white">
        <h2 className="text-[length:4.6cqw] leading-tight font-bold [overflow-wrap:anywhere]">{slide.title}</h2>
        {slide.subtitle ? <p className="text-[length:2.6cqw] opacity-90">{slide.subtitle}</p> : null}
      </div>
      {hint}
    </div>
  )
}

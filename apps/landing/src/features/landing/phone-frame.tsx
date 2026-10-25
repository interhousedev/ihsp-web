/**
 * An iPhone 16 drawn in CSS: a 393×852 viewport (aspect ratio kept, scaled to the column), rounded titanium-like
 * bezel and the Dynamic Island. No external assets; the screenshot is a plain lazy `<img>` of /public/screens.
 */
export function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[240px] rounded-[2.75rem] bg-neutral-800 p-[10px] shadow-xl ring-1 ring-neutral-950/40 dark:bg-neutral-700">
      <div className="relative aspect-[393/852] overflow-hidden rounded-[2.2rem] bg-white">
        {/* oxlint-disable-next-line nextjs/no-img-element -- static export, the screenshot is a plain file of /public */}
        <img
          src={src}
          alt={alt}
          width={393}
          height={852}
          loading="lazy"
          decoding="async"
          className="size-full object-cover object-top"
        />
        <span
          aria-hidden
          className="absolute top-2 left-1/2 h-[22px] w-[30%] -translate-x-1/2 rounded-full bg-neutral-950"
        />
      </div>
    </div>
  )
}

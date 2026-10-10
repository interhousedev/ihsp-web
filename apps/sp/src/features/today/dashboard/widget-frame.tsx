"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Widget } from "./model";

/** Row height of the grid; a 1x1 tile is a square on a phone. */
export const ROW_HEIGHT = "7.5rem";

/** The tile: its size in grid cells, its colour with a readable text colour, and a link to the page it summarises. */
export function WidgetFrame({
  widget,
  title,
  href,
  editing,
  children,
}: {
  widget: Widget;
  title: string;
  href?: string;
  editing?: boolean;
  children: ReactNode;
}) {
  const style: CSSProperties = {
    ...(widget.color
      ? { backgroundColor: widget.color, color: widget.text_color ?? undefined }
      : {}),
  };
  const body = (
    <>
      <span className="flex items-center gap-1 text-xs font-medium opacity-80">
        {title}
      </span>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
        {children}
      </div>
    </>
  );
  return (
    <section
      aria-label={title}
      data-widget-id={widget.id}
      data-widget-kind={widget.kind}
      data-widget-size={widget.size}
      data-text-color={widget.text_color ?? undefined}
      style={style}
      className={`bg-card text-card-foreground flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border p-3 shadow-sm ${editing ? "ring-primary/40 ring-2" : ""}`}
    >
      {href && !editing ? (
        <Link
          href={href}
          className="focus-visible:ring-ring flex h-full flex-col gap-1 rounded-2xl outline-none focus-visible:ring-2"
        >
          {body}
        </Link>
      ) : (
        <div className="flex h-full flex-col gap-1">{body}</div>
      )}
    </section>
  );
}

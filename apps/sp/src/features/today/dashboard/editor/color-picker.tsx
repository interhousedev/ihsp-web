"use client";

import { useT } from "@ihsp/i18n";
import { PALETTE, textOn } from "../model";

/** Tile colours; the text colour of the tile follows the colour (black or white, whichever reads better). */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
}) {
  const t = useT("today.dashboard");
  return (
    <div
      role="group"
      aria-label={t("color")}
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        aria-label={t("colorDefault")}
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className="bg-card focus-visible:ring-ring size-9 rounded-full border outline-none focus-visible:ring-2 aria-pressed:ring-2"
      />
      {PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          aria-pressed={value === color}
          data-text-color={textOn(color)}
          onClick={() => onChange(color)}
          style={{ backgroundColor: color }}
          className="focus-visible:ring-ring size-9 rounded-full border outline-none focus-visible:ring-2 aria-pressed:ring-primary aria-pressed:ring-2"
        />
      ))}
    </div>
  );
}

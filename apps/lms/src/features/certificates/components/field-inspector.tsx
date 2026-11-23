"use client"

import { CERT_FONTS, type CertAlign, type CertField, type CertQrStyle } from "@ihsp/api"
import { useT } from "@ihsp/i18n"
import {
  Button,
  Icons,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  ToggleGroup,
  ToggleGroupItem,
} from "@ihsp/ui"
import { useId } from "react"
import { certFamily } from "../hooks/use-cert-fonts"
import { SIZE_MAX, SIZE_MIN, clamp } from "../utils/layout"

const WEIGHTS = [300, 400, 500, 600, 700, 800] as const
const ALIGNS: CertAlign[] = ["left", "center", "right"]
const SWATCHES = ["#111111", "#1f2937", "#0f3d6e", "#7a1f2b", "#8a6d1d", "#ffffff"]

/** A colour picker with a few quick swatches; `<input type="color">` gives the full palette. */
export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="border-input size-11 cursor-pointer rounded-md border bg-transparent p-0.5 md:size-8"
        />
        {SWATCHES.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={swatch}
            aria-pressed={value.toLowerCase() === swatch}
            onClick={() => onChange(swatch)}
            className="aria-pressed:ring-primary size-11 rounded-full border ring-offset-2 aria-pressed:ring-2 md:size-6"
            style={{ background: swatch }}
          />
        ))}
      </div>
    </div>
  )
}

/** Font, size, weight, colour and alignment of the selected text field; QR colours and shape for the QR field. */
export function FieldInspector({
  field,
  qr,
  onField,
  onQr,
  onRemove,
}: {
  field: CertField
  qr: CertQrStyle
  onField: (field: CertField) => void
  onQr: (qr: CertQrStyle) => void
  onRemove: () => void
}) {
  const t = useT("courseCertificates")
  const ids = { font: useId(), weight: useId(), text: useId(), size: useId(), logo: useId() }
  const set = (patch: Partial<CertField>) => onField({ ...field, ...patch })
  const name = t(`field.${field.key}`)

  return (
    <section aria-label={t("design.inspector", { field: name })} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{name}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="min-h-11 md:min-h-8">
          <Icons.trash aria-hidden />
          {t("design.removeField")}
        </Button>
      </div>

      {field.key === "qr" ? (
        <>
          <div className="flex flex-col gap-1">
            <Label>{t("qr.style")}</Label>
            <ToggleGroup
              value={[qr.style]}
              variant="outline"
              aria-label={t("qr.style")}
              onValueChange={(values) => {
                const next = values[0]
                if (next === "square" || next === "rounded" || next === "dots") onQr({ ...qr, style: next })
              }}
            >
              {(["square", "rounded", "dots"] as const).map((style) => (
                <ToggleGroupItem key={style} value={style} className="min-h-11 px-3 md:min-h-8">
                  {t(`qr.styles.${style}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <ColorField label={t("qr.fg")} value={qr.fg} onChange={(fg) => onQr({ ...qr, fg })} />
          <ColorField label={t("qr.bg")} value={qr.bg} onChange={(bg) => onQr({ ...qr, bg })} />
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={ids.logo}>{t("qr.logo")}</Label>
            <Switch id={ids.logo} checked={qr.logo} onCheckedChange={(logo) => onQr({ ...qr, logo })} />
          </div>
        </>
      ) : (
        <>
          {field.key === "custom_text" ? (
            <div className="flex flex-col gap-1">
              <Label htmlFor={ids.text}>{t("design.text")}</Label>
              <Input
                id={ids.text}
                value={field.text ?? ""}
                maxLength={200}
                onChange={(event) => set({ text: event.target.value })}
                className="min-h-11 md:min-h-8"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <Label htmlFor={ids.font}>{t("design.font")}</Label>
            <Select
              value={field.font}
              items={CERT_FONTS.map((font) => ({ value: font, label: t(`fonts.${font}`) }))}
              onValueChange={(value) => value && set({ font: value as CertField["font"] })}
            >
              <SelectTrigger id={ids.font} className="min-h-11 w-full md:min-h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CERT_FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: `${certFamily(font)}, serif` }} className="text-base">
                      {t(`fonts.${font}`)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={ids.size}>{t("design.size")}</Label>
            <Slider
              id={ids.size}
              min={SIZE_MIN * 1000}
              max={SIZE_MAX * 1000}
              step={1}
              value={[Math.round(field.size * 1000)]}
              aria-label={t("design.size")}
              onValueChange={(value) => {
                const raw = Array.isArray(value) ? value[0] : value
                if (typeof raw === "number") set({ size: clamp(raw / 1000, SIZE_MIN, SIZE_MAX) })
              }}
            />
            <div aria-hidden className="text-muted-foreground flex justify-between text-xs">
              <span>{t("design.smaller")}</span>
              <span>{t("design.larger")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={ids.weight}>{t("design.weight")}</Label>
            <Select
              value={String(field.weight)}
              items={WEIGHTS.map((weight) => ({ value: String(weight), label: t(`weights.${weight}`) }))}
              onValueChange={(value) => value && set({ weight: Number(value) })}
            >
              <SelectTrigger id={ids.weight} className="min-h-11 w-full md:min-h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEIGHTS.map((weight) => (
                  <SelectItem key={weight} value={String(weight)}>
                    <span style={{ fontFamily: `${certFamily(field.font)}, serif`, fontWeight: weight }}>
                      {t(`weights.${weight}`)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ColorField label={t("design.color")} value={field.color} onChange={(color) => set({ color })} />
          <div className="flex flex-col gap-1">
            <Label>{t("design.align")}</Label>
            <ToggleGroup
              value={[field.align]}
              variant="outline"
              aria-label={t("design.align")}
              onValueChange={(values) => {
                const next = values[0]
                if (next === "left" || next === "center" || next === "right") set({ align: next })
              }}
            >
              {ALIGNS.map((align) => (
                <ToggleGroupItem key={align} value={align} className="min-h-11 px-3 md:min-h-8">
                  {t(`aligns.${align}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </>
      )}
      <p className="text-muted-foreground text-xs">{t("design.keyboardHint")}</p>
    </section>
  )
}

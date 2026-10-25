"use client"

import { BODY_SIZE } from "../slide-bullets"
import type { LayoutProps } from "./layout-props"

/** A heading and a small table. */
export function TableSlide({ slide, tier, hint }: LayoutProps) {
  const table = slide.table
  return (
    <div className="flex h-full flex-col gap-[2.4cqw] p-[5cqw]">
      <h2 className="border-primary border-b-[0.5cqw] pb-[1.2cqw] text-[length:4.6cqw] leading-tight font-bold [overflow-wrap:anywhere]">
        {slide.title}
      </h2>
      {table ? (
        <table className={`w-full table-fixed border-collapse text-start ${BODY_SIZE[tier === 0 ? 1 : tier]}`}>
          <thead>
            <tr className="bg-primary/10">
              {table.columns.map((column, index) => (
                <th key={index} scope="col" className="border px-[1.4cqw] py-[1cqw] text-start font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? "bg-muted/50" : undefined}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="border px-[1.4cqw] py-[1cqw] align-top [overflow-wrap:anywhere]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {hint}
    </div>
  )
}

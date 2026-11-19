"use client"

import { useT } from "@ihsp/i18n"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icons } from "@ihsp/ui"
import { useState } from "react"
import { BLOCK_KINDS, MAX_BLOCKS, appendBlock, bodyBlocks, type BlockKind } from "../openui-source"
import { BlockForm } from "./block-form"

/** The toolbar "Insert block" menu and the small form of the chosen kind; the block is appended to the Markdown body. */
export function InsertBlockMenu({ body, onBody }: { body: string; onBody: (body: string) => void }) {
  const t = useT("kb.staff.block")
  const [kind, setKind] = useState<BlockKind | null>(null)
  const full = bodyBlocks(body).count >= MAX_BLOCKS
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="min-h-11 md:min-h-8" disabled={full}>
              <Icons.add aria-hidden />
              {t("insert")}
            </Button>
          }
        />
        <DropdownMenuContent>
          {BLOCK_KINDS.map((entry) => (
            <DropdownMenuItem key={entry} onClick={() => setKind(entry)}>
              {t(`kind.${entry}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {full ? <span className="text-muted-foreground text-xs">{t("limit", { max: MAX_BLOCKS })}</span> : null}
      {kind ? (
        <div className="w-full">
          <BlockForm
            kind={kind}
            onCancel={() => setKind(null)}
            onSubmit={(source) => {
              onBody(appendBlock(body, source))
              setKind(null)
            }}
          />
        </div>
      ) : null}
    </>
  )
}

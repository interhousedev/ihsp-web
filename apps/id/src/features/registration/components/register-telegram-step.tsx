"use client"

import { postRegisterTelegramStatus } from "@ihsp/api"
import { getConfig } from "@ihsp/config"
import { Button, QrCode, IconBrandTelegram, IconCircleCheck, IconKey, IconShieldCheck } from "@ihsp/ui"
import { useQuery } from "@tanstack/react-query"
import { FlowCard } from "../../shared/components/flow-card"
import { LinkButton } from "../../shared/components/link-button"
import { useTr } from "../../shared/hooks/use-tr"

const POLL_MS = 3000

/** The mandatory Telegram step: a one-time `/start` deep link; the page polls until the bot has linked the account. */
export function RegisterTelegramStep({ code, onContinue }: { code: string; onContinue: () => void }) {
  const t = useTr()
  const url = `https://t.me/${getConfig().BOT_USERNAME}?start=link_${code}`
  const status = useQuery({
    queryKey: ["register", "telegram-status", code],
    queryFn: () => postRegisterTelegramStatus({ code }),
    refetchInterval: (query) => (query.state.data?.linked ? false : POLL_MS),
    gcTime: 0,
  })
  const linked = status.data?.linked === true

  return (
    <FlowCard title={t("register.telegram.title")} description={t("register.telegram.description")}>
      <ul className="grid gap-3 text-sm">
        <li className="flex items-start gap-3">
          <IconShieldCheck aria-hidden className="text-primary mt-0.5 size-5 shrink-0" />
          {t("register.telegram.codes")}
        </li>
        <li className="flex items-start gap-3">
          <IconKey aria-hidden className="text-primary mt-0.5 size-5 shrink-0" />
          {t("register.telegram.emis")}
        </li>
      </ul>
      {linked ? (
        <p role="status" className="flex items-center gap-2 text-sm font-medium">
          <IconCircleCheck aria-hidden className="text-primary size-5 shrink-0" />
          {t("register.telegram.linked")}
        </p>
      ) : (
        <>
          <LinkButton href={url} newTab>
            <IconBrandTelegram aria-hidden className="size-4" />
            {t("register.telegram.link")}
          </LinkButton>
          <div className="hidden justify-center md:flex">
            <QrCode value={url} size={128} label={t("register.telegram.qr")} />
          </div>
          <p aria-live="polite" className="text-muted-foreground text-center text-sm">
            {t("register.telegram.waiting")}
          </p>
        </>
      )}
      <Button type="button" className="h-11 text-base" disabled={!linked} onClick={onContinue}>
        {t("register.welcome.continue")}
      </Button>
    </FlowCard>
  )
}

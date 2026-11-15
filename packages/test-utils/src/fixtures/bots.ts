import type { Bot, BotFeatures } from "@ihsp/api"

const ALL_ON: BotFeatures = {
  ai_agent: true,
  open_ai_agent: true,
  commands: true,
  notifications: true,
  announcements: true,
  mini_app: true,
}

const ALL_OFF: BotFeatures = {
  ai_agent: false,
  open_ai_agent: false,
  commands: false,
  notifications: false,
  announcements: false,
  mini_app: false,
}

/** `GET /v1/admin/bots`: the default bot first, then a second bot with only announcements on. */
export const botList: Bot[] = [
  {
    id: "bot-main",
    name: "Main bot",
    username: "main_test_bot",
    enabled: true,
    is_default: true,
    features: ALL_ON,
    token_mask: "…a1b2",
    members: 412,
    created_at: "2026-01-10T08:00:00Z",
    updated_at: "2026-01-10T08:00:00Z",
  },
  {
    id: "bot-news",
    name: "News bot",
    username: "news_test_bot",
    enabled: true,
    is_default: false,
    features: { ...ALL_OFF, announcements: true },
    token_mask: "…zz99",
    members: 37,
    created_at: "2026-02-01T08:00:00Z",
    updated_at: "2026-02-01T08:00:00Z",
  },
]

import { default as process } from "node:process"

import { ActivityType, Client, GatewayIntentBits } from "discord.js"

import { info } from "@postfmly/logger"
import { type LogoServer } from "@postfmly/logoserver"
import { type Nullable } from "@postfmly/types"

import { env } from "../env.ts"
import { DB } from "./db.ts"

// biome-ignore lint/nursery/useExplicitType: inferred
const { DEBUG, TOKEN } = env

let SERVER: Nullable<LogoServer> = null

let CLIENT: Nullable<Client> = null

let isShutdown: boolean = false

const EVENTS: string[] = ["SIGINT", "SIGTERM"]

const shutdown = (event: string): void => {
  if (isShutdown) {
    if (DEBUG) {
      info("⚠️  Already shut down")
    }
    return
  }

  if (DEBUG) {
    info(`❌ ${event} detected`)
  }

  info("🔴 Shutting down...")

  isShutdown = true

  Promise.resolve()
    .then(() => DB.close())
    .then(() => Promise.resolve(CLIENT?.destroy()))
    .then(() => SERVER?.stop())
    .then(() => process.exit(0))
}

const client = (logoServer: LogoServer): Client => {
  SERVER = logoServer

  CLIENT = new Client({
    intents: [GatewayIntentBits.Guilds],
    presence: {
      activities: [
        {
          name: "Tracking...",
          type: ActivityType.Custom
        }
      ]
    }
  })

  for (const event of EVENTS) {
    process.on(event, (e: string): void => {
      shutdown(e)
    })
  }

  return CLIENT
}

const login = async (): Promise<void> => {
  if (!CLIENT) {
    throw new Error("Invalid CLIENT")
  }

  await CLIENT.login(TOKEN)

  if (CLIENT.user && DEBUG) {
    info(`⚡ Connected as ${CLIENT.user.displayName} (${CLIENT.user.tag})`)
  }
}

export { client, login, shutdown }

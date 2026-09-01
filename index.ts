import { error, info } from "@postfmly/logger"
import { type ILogoServerConfig, LogoServer } from "@postfmly/logoserver"

import { env } from "./env.ts"
import { loadCommands } from "./events/loadCommands.ts"
import { client, login, shutdown } from "./utils/client.ts"
import { DB } from "./utils/db.ts"

// biome-ignore lint/nursery/useExplicitType: inferred
const { DEBUG, LOGO_NAME, LOGO_PATH, LOGO_PORT } = env

const logoServer: LogoServer = new LogoServer({ DEBUG, LOGO_NAME, LOGO_PATH, LOGO_PORT } as ILogoServerConfig)

Promise.resolve()
  .then(() => DB.open())
  .then(() => loadCommands(client(logoServer)))
  .then(() => login())
  .then(() => logoServer.start())
  .then(() => info("🟢 Running..."))
  .catch((e: unknown) => {
    error(e)
    shutdown("ERROR")
  })

import { error, info } from "@postfmly/logger"
import { type ILogoServerConfig, LogoServer } from "@postfmly/logoserver"

import { loadCommands } from "./events/loadCommands.ts"
import { client, login, shutdown } from "./utils/client.ts"
import { DB } from "./utils/db.ts"
import { env } from "./utils/env.ts"
import { type IEnv } from "./utils/IEnv.ts"

const { DEBUG, LOGO_NAME, LOGO_PATH, LOGO_PORT }: IEnv = env

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

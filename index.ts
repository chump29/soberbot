import { error, info } from "@postfmly/logger"

import { init, shutdown } from "./utils/client.ts"
import { DB } from "./utils/db.ts"

try {
  DB.open()

  await init()

  info("🟢 Running...")
} catch (e: unknown) {
  error(e)

  await shutdown()
}

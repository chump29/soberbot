import { Bucket } from "@postfmly/checkrate"
import { error, info } from "@postfmly/logger"

import { init, shutdown } from "./utils/client.ts"
import { DB } from "./utils/db.ts"

const bucket: Bucket = new Bucket()

try {
  DB.open()

  await init()

  info("🟢 Running...")
} catch (e: unknown) {
  error(e)

  await shutdown()
}

export { bucket }

import { describe, expect, test } from "bun:test"

import { env } from "../utils/env.ts"
import { type IEnv } from "../utils/IEnv.ts"

const IEnvMatcher: IEnv = {
  CHANNEL_ID: expect.any(String),
  COLOR: expect.any(String),
  DB_NAME: expect.any(String),
  DB_PATH: expect.any(String),
  DEBUG: expect.any(Boolean),
  LOGO_NAME: expect.any(String),
  LOGO_PATH: expect.any(String),
  LOGO_PORT: expect.any(String), // number|"random"
  LOGO_URL: expect.any(String),
  NAME: expect.any(String),
  TOKEN: expect.any(String)
}

describe("IEnv", (): void => {
  test("IEnv", (): void => {
    expect(env).toMatchObject(IEnvMatcher)
  })
})

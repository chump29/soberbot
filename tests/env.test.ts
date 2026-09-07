import { describe, expect, test } from "bun:test"

import { expectTypeOf } from "expect-type"

import { env } from "../utils/env.ts"
import { type IEnv } from "../utils/IEnv.ts"

const { CHANNEL_ID, COLOR, DB_NAME, DB_PATH, DEBUG, LOGO_NAME, LOGO_PATH, LOGO_PORT, LOGO_URL, NAME, TOKEN }: IEnv = env

describe("env", (): void => {
  test("CHANNEL_ID", (): void => {
    expectTypeOf(CHANNEL_ID).toEqualTypeOf<string>()

    expect(CHANNEL_ID.length).toBeGreaterThan(0)
  })

  test("COLOR", (): void => {
    expectTypeOf(COLOR).toEqualTypeOf<string>()

    expect(COLOR.length).toBeGreaterThan(0)
  })

  test("DB_NAME", (): void => {
    expectTypeOf(DB_NAME).toEqualTypeOf<string>()

    expect(DB_NAME.length).toBeGreaterThan(0)
  })

  test("DB_PATH", (): void => {
    expectTypeOf(DB_PATH).toEqualTypeOf<string>()

    expect(DB_PATH.length).toBeGreaterThan(0)
  })

  test("DEBUG", (): void => {
    expectTypeOf(DEBUG).toEqualTypeOf<boolean>()

    expect(DEBUG).toBeTrue()
  })

  test("LOGO_NAME", (): void => {
    expectTypeOf(LOGO_NAME).toEqualTypeOf<string>()

    expect(LOGO_NAME.length).toBeGreaterThan(0)
  })

  test("LOGO_PATH", (): void => {
    expectTypeOf(LOGO_PATH).toEqualTypeOf<string>()

    expect(LOGO_PATH.length).toBeGreaterThan(0)
  })

  test("LOGO_PORT", (): void => {
    expectTypeOf(LOGO_PORT).toEqualTypeOf<number | "random">()

    expect((LOGO_PORT as string).length).toBeGreaterThan(0)
  })

  test("LOGO_URL", (): void => {
    expectTypeOf(LOGO_URL).toEqualTypeOf<string>()

    expect(LOGO_URL.length).toBeGreaterThan(0)
  })

  test("NAME", (): void => {
    expectTypeOf(NAME).toEqualTypeOf<string>()

    expect(NAME.length).toBeGreaterThan(0)
  })

  test("TOKEN", (): void => {
    expectTypeOf(TOKEN).toEqualTypeOf<string>()

    expect(TOKEN.length).toBeGreaterThan(0)
  })
})

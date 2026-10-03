import { describe, expect, test } from "bun:test"
import { $ } from "bun"

import { expectTypeOf } from "expect-type"

import { env } from "../../utils/env.ts"

describe("env", (): void => {
  test("COLOR", (): void => {
    expectTypeOf(env.COLOR).toEqualTypeOf<string>()

    expect(env.COLOR).toBe("#78866b")
  })

  test("DB_NAME", (): void => {
    expectTypeOf(env.DB_NAME).toEqualTypeOf<string>()

    expect(env.DB_NAME).toBe("soberbot.test.db")
  })

  test("DB_PATH", (): void => {
    expectTypeOf(env.DB_PATH).toEqualTypeOf<string>()

    expect(env.DB_PATH).toBe("./db")
  })

  test("DEBUG", (): void => {
    expectTypeOf(env.DEBUG).toEqualTypeOf<boolean>()

    expect(env.DEBUG).toBeTrue()
  })

  test("LOGO_NAME", (): void => {
    expectTypeOf(env.LOGO_NAME).toEqualTypeOf<string>()

    expect(env.LOGO_NAME).toBe("soberbot.webp")
  })

  test("LOGO_PATH", (): void => {
    expectTypeOf(env.LOGO_PATH).toEqualTypeOf<string>()

    expect(env.LOGO_PATH).toBe("./utils/images")
  })

  test("LOGO_PORT", (): void => {
    expectTypeOf(env.LOGO_PORT).toEqualTypeOf<number | "random">()

    expect(env.LOGO_PORT as string).toBe("random")
  })

  test("LOGO_URL", (): void => {
    expectTypeOf(env.LOGO_URL).toEqualTypeOf<string>()

    expect(env.LOGO_URL.length).toBeGreaterThan(0)
  })

  test("NAME", (): void => {
    expectTypeOf(env.NAME).toEqualTypeOf<string>()

    expect(env.NAME).toBe("SoberBot")
  })

  test("TOKEN", (): void => {
    expectTypeOf(env.TOKEN).toEqualTypeOf<string>()

    expect(env.TOKEN.length).toBeGreaterThan(0)
  })

  test("print", async (): Promise<void> => {
    const txt = await $`bun run --bun ./utils/env.ts`.text()

    expect(txt).toContain("[REDACTED]")
  })
})

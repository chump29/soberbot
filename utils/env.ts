import { type Optional } from "@postfmly/types"

import { bool, cleanEnv, type ExactValidator, makeExactValidator, str, url } from "envalid"
import { anyOf, caseInsensitive, createRegExp, wordChar } from "magic-regexp"
import {
  digits,
  hexColor,
  integer,
  literal,
  maxLength,
  maxValue,
  minLength,
  minValue,
  nonEmpty,
  parse,
  pipe,
  regex,
  string,
  toNumber,
  trim,
  union
} from "valibot"

const ID_MIN_LEN: number = 17
const ID_MAX_LEN: number = 19

const MIN_PORT: number = 1024
const MAX_PORT: number = 65_535

const UID_MIN_LEN: number = 23
const UID_MAX_LEN: number = 28
const TS_MIN_LEN: number = 6
const TS_MAX_LEN: number = 7
const HMAC_MIN_LEN: number = 27
const HMAC_MAX_LEN: number = 38

const StringSchema = pipe(string(), trim(), nonEmpty())
const IdSchema = pipe(StringSchema, digits(), minLength(ID_MIN_LEN), maxLength(ID_MAX_LEN))
const ColorSchema = pipe(StringSchema, hexColor())
const PortSchema = union([
  literal("random"),
  pipe(StringSchema, toNumber(), integer(), minValue(MIN_PORT), maxValue(MAX_PORT))
])
const TokenSchema = pipe(
  StringSchema,
  regex(
    createRegExp(
      anyOf(wordChar, "-").times.between(UID_MIN_LEN, UID_MAX_LEN).at.lineStart(),
      ".",
      anyOf(wordChar, "-").times.between(TS_MIN_LEN, TS_MAX_LEN),
      ".",
      anyOf(wordChar, "-").times.between(HMAC_MIN_LEN, HMAC_MAX_LEN).at.lineEnd(),
      [caseInsensitive]
    )
  )
)

const idValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(IdSchema, s))
const colorValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(ColorSchema, s))
const portValidator: ExactValidator<"random" | number> = makeExactValidator<"random" | number>(
  (s: string): "random" | number => parse(PortSchema, s)
)
const tokenValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(TokenSchema, s))

let fakeChannelId: Optional<string>
let fakeToken: Optional<string>

if (Bun.env.NODE_ENV === "test") {
  const { simpleFaker: fake } = await import("@faker-js/faker")

  fakeChannelId = fake.string.numeric({ allowLeadingZeros: false, length: { max: ID_MAX_LEN, min: ID_MIN_LEN } })

  const word: string = "[a-zA-Z0-9]"

  fakeToken = fake.helpers.fromRegExp(
    `${word}{${UID_MIN_LEN},${UID_MAX_LEN}}[.]${word}{${TS_MIN_LEN},${TS_MAX_LEN}}[.]${word}{${HMAC_MIN_LEN},${HMAC_MAX_LEN}}`
  )
}

const env = cleanEnv(Bun.env, {
  CHANNEL_ID: idValidator({ testDefault: fakeChannelId }),
  COLOR: colorValidator({ default: "#78866b" }),
  DB_NAME: str({ default: "soberbot.db", testDefault: "soberbot.test.db" }),
  DB_PATH: str({ default: "./db" }),
  DEBUG: bool({ default: false, testDefault: true }),
  LOGO_NAME: str({ default: "soberbot.webp" }),
  LOGO_PATH: str({ default: "./utils/images" }),
  LOGO_PORT: portValidator({ default: "random" }),
  LOGO_URL: url({ testDefault: "my.url" }),
  NAME: str({ default: "SoberBot" }),
  TOKEN: tokenValidator({ testDefault: fakeToken })
})

export { env }

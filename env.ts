import { fakerEN_US as fake } from "@faker-js/faker"
import { bool, cleanEnv, type ExactValidator, makeExactValidator, url } from "envalid"
import {
  hexColor,
  integer,
  literal,
  maxLength,
  maxValue,
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

const ID_LEN: number = 19

const MIN_PORT: number = 1024
const MAX_PORT: number = 65_535

const TOKEN_ID: number = 26
const TOKEN_EPOCH: number = 6
const TOKEN_HMAC: number = 38

const StringSchema = pipe(string(), trim(), nonEmpty())
const IdSchema = pipe(StringSchema, maxLength(ID_LEN), regex(/^\d+$/))
const ColorSchema = pipe(StringSchema, hexColor())
const PortSchema = union([
  literal("random"),
  pipe(StringSchema, toNumber(), integer(), minValue(MIN_PORT), maxValue(MAX_PORT))
])
const TokenSchema = pipe(StringSchema, regex(/^\w{26}\.\w{6}\.\w{38}$/))

const idValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(IdSchema, s))
const colorValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(ColorSchema, s))
const stringValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string =>
  parse(StringSchema, s)
)
const portValidator: ExactValidator<"random" | number> = makeExactValidator<"random" | number>(
  (s: string): "random" | number => parse(PortSchema, s)
)
const tokenValidator: ExactValidator<string> = makeExactValidator<string>((s: string): string => parse(TokenSchema, s))

const env = cleanEnv(Bun.env, {
  CHANNEL_ID: idValidator({ testDefault: fake.string.numeric({ allowLeadingZeros: false, length: ID_LEN }) }),
  COLOR: colorValidator({ default: "#78866b" }),
  DB_NAME: stringValidator({ default: "soberbot.db" }),
  DB_PATH: stringValidator({ default: "./db" }),
  DEBUG: bool({ default: false }),
  LOGO_NAME: stringValidator({ default: "soberbot.webp" }),
  LOGO_PATH: stringValidator({ default: "./utils/images" }),
  LOGO_PORT: portValidator({ default: "random" }),
  LOGO_URL: url({ testDefault: fake.image.url() }),
  NAME: stringValidator({ default: "SoberBot" }),
  TOKEN: tokenValidator({
    testDefault: `${fake.string.alphanumeric(TOKEN_ID)}.${fake.string.alphanumeric(TOKEN_EPOCH)}.${fake.string.alphanumeric(TOKEN_HMAC)}`
  })
})

export { env, StringSchema }

import { default as assert } from "node:assert/strict"
import { readdir } from "node:fs/promises"
import { default as path } from "node:path"

import { afterAll, beforeAll, describe, expect, mock, spyOn, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"
import { type APIEmbed, type ChatInputCommandInteraction, EmbedBuilder, type User } from "discord.js"
import { match, P } from "ts-pattern"

import {
  DATE_FORMAT,
  type ISubstance,
  type IUser,
  MAX_USER_ID_LEN,
  MIN_USER_ID_LEN,
  substances,
  users
} from "../../db/schema.ts"
import { type ICreate } from "../../events/clientReady.ts"
import { type IInvoke } from "../../events/interactionCreate.ts"
import { author, version } from "../../package.json" with { type: "json" }
import { DB, type TxType } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

if (!env.TEST_FULL) {
  spyOn(console, "info").mockImplementation((): void => undefined)
}

const HEX_BASE = 16
const COLOR_LEN = 6
const decimalToHex = (c: Optional<number>): string => (c ? `#${c.toString(HEX_BASE).padStart(COLOR_LEN, "0")}` : "N/A")

const dir = "events/commands"

const commands = (await readdir(dir)).filter((file: string): boolean => file.endsWith(".ts"))

const NUM_SUBSTANCES = 2

const getUserId = (): string => fake.helpers.fromRegExp(`[0-9]{${MIN_USER_ID_LEN},${MAX_USER_ID_LEN}}`)

const getSubstanceName = (): string => fake.lorem.word()

const getDate = (): string => dayjs(fake.date.past({ years: 10 })).format(DATE_FORMAT)

beforeAll(async (): Promise<void> => {
  DB.open()

  assert(DB.instance)

  await DB.instance.delete(users)

  const userId = getUserId()

  DB.instance.transaction((tx: TxType): void => {
    tx.insert(users)
      .values({
        userId,
        userName: fake.internet.username()
      } satisfies IUser)
      .run()

    tx.insert(substances)
      .values(
        Array.from(
          { length: NUM_SUBSTANCES },
          (): ISubstance => ({ userId, date: getDate(), name: getSubstanceName() }) satisfies ISubstance
        )
      )
      .run()
  })
})

afterAll((): void => {
  DB.close()
})

await Promise.all(
  commands.map(async (command: string): Promise<void> => {
    const file: ICreate & IInvoke = await import(`${path.join("../..", dir)}/${command}`)

    const name = path.basename(command, ".ts")

    describe(`/${name}`, (): void => {
      test("create", (): void => {
        const c = file.create()

        expect(c.name).toBe(name)
        expect(c.description).not.toBeEmpty()
        expect(c.contexts ?? []).not.toBeEmpty()
      })

      type YMD = "year" | "month" | "day"

      const [mockDeferReply, mockEditReply] = [
        mock<ChatInputCommandInteraction["deferReply"]>(),
        mock<ChatInputCommandInteraction["editReply"]>()
      ]

      test("invoke", async (): Promise<void> => {
        expect(
          await file.invoke(
            createMock<ChatInputCommandInteraction>({
              createdTimestamp: fake.date.past().getTime(),
              deferReply: mockDeferReply,
              editReply: mockEditReply,
              user: createMock<User>({
                displayName: fake.internet.displayName(),
                id: getUserId(),
                username: fake.internet.username()
              }),
              options: {
                getInteger: mock<(s: YMD) => number>().mockImplementation((s: YMD): number => {
                  const date: dayjs.Dayjs = dayjs(fake.date.past())

                  return match<YMD, number>(s)
                    .with("year", (): number => date.year())
                    .with("month", (): number => date.month() + 1)
                    .with("day", (): number => date.date())
                    .exhaustive()
                }),
                getString: mock<() => string>().mockReturnValue(fake.internet.username())
              }
            })
          )
        ).toBeUndefined()

        expect(mockDeferReply).toHaveBeenCalledOnce()
        expect(mockEditReply).toHaveBeenCalledOnce()

        const payload = mockEditReply.mock.calls[0]?.[0]
        if (!payload || typeof payload !== "object") {
          throw new Error("Payload not found")
        }

        const isEmbed = (e: unknown): e is APIEmbed => typeof e === "object" && e !== null && !Array.isArray(e)

        let data: APIEmbed
        if ("embeds" in payload && Array.isArray(payload.embeds)) {
          const [firstEmbed] = payload.embeds
          if (!isEmbed(firstEmbed)) {
            throw new Error("Embed not found")
          }

          ;({ data } = EmbedBuilder.from(firstEmbed))
        }

        let content = ""
        if ("content" in payload && typeof payload.content === "string") {
          ;({ content } = payload)
        }

        match<string, void>(name)
          .with("all", (): void => {
            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.title).toStartWith(`${env.NAME} Dates`)
            expect(data.fields).not.toBeEmpty()
          })
          .with(P.union("delete", "list", "reset", "streak"), (): void => expect(content).toInclude("❌"))
          .with("info", (): void => {
            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.author?.icon_url).toBe(env.LOGO_URL)
            expect(data.author?.name).toBe(`${env.NAME} v${version}`)
            expect(data.thumbnail?.url).toBe(env.LOGO_URL)
            expect(data.description).not.toBeEmpty()
            expect(data.footer?.text).toEndWith(author.name)
          })
          .with("ping", (): void => expect(content).toInclude("Pong"))
          .with("set", (): void => expect(content).not.toBeEmpty())
          .otherwise((): never => {
            throw new Error(`Payload tests not found for /${name}`)
          })
      })
    })
  })
)

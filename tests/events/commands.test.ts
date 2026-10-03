import { default as assert } from "node:assert/strict"
import { readdir } from "node:fs/promises"
import { default as path } from "node:path"

import { afterAll, beforeAll, describe, expect, jest, spyOn, test } from "bun:test"

import { type Optional } from "@postfmly/types"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"
import {
  type ChatInputCommandInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type User
} from "discord.js"
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
import { author, version } from "../../package.json" with { type: "json" }
import { DB } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

interface ICommandFile {
  create: () => RESTPostAPIChatInputApplicationCommandsJSONBody
  invoke: (interaction: ChatInputCommandInteraction) => Promise<void>
}

const HEX_BASE: number = 16
const COLOR_LEN: number = 6
const decimalToHex = (c: Optional<number>): string => (c ? `#${c.toString(HEX_BASE).padStart(COLOR_LEN, "0")}` : "N/A")

const dir: string = "events/commands"

const commands: string[] = (await readdir(dir)).filter((file: string): boolean => file.endsWith(".ts"))

const NUM_SUBSTANCES: number = 2

const getUserId = (): string => fake.helpers.fromRegExp(`[0-9]{${MIN_USER_ID_LEN},${MAX_USER_ID_LEN}}`)

const getSubstanceName = (): string => fake.lorem.word()

const getDate = (): string => dayjs(fake.date.past({ years: 10 })).format(DATE_FORMAT)

const infoSpy: jest.Mock = spyOn(console, "info")

beforeAll(async (): Promise<void> => {
  infoSpy.mockReset()

  DB.open()

  assert(DB._db)

  await DB._db.delete(users)

  const userId: string = getUserId()

  // @ts-expect-error: no types
  await DB._db.transaction(async (tx) => {
    await tx.insert(users).values({
      userId,
      userName: fake.internet.username()
    } satisfies IUser)

    await tx
      .insert(substances)
      .values(
        Array.from(
          { length: NUM_SUBSTANCES },
          (): ISubstance => ({ userId, date: getDate(), name: getSubstanceName() }) satisfies ISubstance
        )
      )
  })
})

afterAll((): void => {
  DB.close()
})

await Promise.all(
  commands.map(async (command: string): Promise<void> => {
    const { create, invoke } = (await import(`${path.join("../..", dir)}/${command}`)) satisfies ICommandFile

    const name: string = path.basename(command, ".ts")

    describe(`/${name}`, (): void => {
      test("create", (): void => {
        const c: RESTPostAPIChatInputApplicationCommandsJSONBody = create()

        expect(c.name).toBe(name)
        expect(c.description).not.toBeEmpty()
        expect(c.contexts ?? []).not.toBeEmpty()
      })

      type YMD = "year" | "month" | "day"

      test("invoke", async (): Promise<void> => {
        const interaction: ChatInputCommandInteraction = {
          createdTimestamp: fake.date.past().getTime(),
          deferReply: jest.fn().mockResolvedValue(undefined),
          editReply: jest.fn().mockResolvedValue(undefined),
          user: {
            displayName: fake.internet.displayName(),
            id: getUserId(),
            username: fake.internet.username()
          } as User,
          options: {
            getInteger: jest.fn().mockImplementation((s: YMD): number => {
              const date: dayjs.Dayjs = dayjs(fake.date.past())

              return match<YMD, number>(s)
                .with("year", (): number => date.year())
                .with("month", (): number => date.month() + 1)
                .with("day", (): number => date.date())
                .exhaustive()
            }),
            getString: jest.fn().mockReturnValue(fake.internet.username())
          }
        } as unknown as ChatInputCommandInteraction

        expect(await invoke(interaction)).toBeUndefined()

        expect(interaction.deferReply).toHaveBeenCalled()
        expect(interaction.editReply).toHaveBeenCalled()

        const mockEditReply = interaction.editReply as ReturnType<typeof jest.fn>
        const firstCallArgs = mockEditReply.mock.calls
        const payload = firstCallArgs[0]?.[0]
        if (!payload) {
          throw new Error("Payload not found")
        }

        match<string, void>(name)
          .with(P.union("all"), (): void => {
            const data = payload.embeds?.[0]

            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.title).toStartWith(`${env.NAME} Dates`)
            expect(data.fields).not.toBeEmpty()
          })
          .with(P.union("delete", "list", "reset", "streak"), (): void => expect(payload.content).toInclude("❌"))
          .with("ping", (): void => expect(payload.content).toInclude("Pong"))
          .with("info", (): void => {
            const data = payload.embeds?.[0].data

            expect(decimalToHex(data.color)).toBe(env.COLOR)
            expect(data.author.icon_url).toBe(env.LOGO_URL)
            expect(data.author.name).toBe(`${env.NAME} v${version}`)
            expect(data.thumbnail.url).toBe(env.LOGO_URL)
            expect(data.description).not.toBeEmpty()
            expect(data.footer.text).toEndWith(author.name)
          })
          .with("set", (): void => expect(payload.content).not.toBeEmpty())
          .otherwise((): void => {
            throw new Error(`Payload tests not found for /${name}`)
          })
      })
    })
  })
)

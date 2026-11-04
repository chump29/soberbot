import { default as assert } from "node:assert/strict"

import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"
import { eq, ne } from "drizzle-orm"
import { titleCase } from "title-case"

import { DATE_FORMAT, type ISubstance, type IUser, MAX_USER_ID_LEN, substances, users } from "../../db/schema.ts"
import { DB, type TxType } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

const infoSpy = spyOn(console, "info")
if (!env.TEST_FULL) {
  infoSpy.mockImplementation((): void => undefined)
}

const NUM_SUBSTANCES = 2

const userId = fake.string.numeric({ allowLeadingZeros: false, length: MAX_USER_ID_LEN })
let substanceName = ""

const getSubstanceName = (): string => {
  let tmp: string
  do {
    tmp = fake.lorem.word()
  } while (tmp === substanceName)

  if (substanceName.length === 0) {
    substanceName = tmp
  }

  return tmp
}

const getDate = (): string => dayjs(fake.date.past({ years: 10 })).format(DATE_FORMAT)

beforeAll(async (): Promise<void> => {
  infoSpy.mockReset()

  DB.open()

  assert(DB.instance)

  await DB.instance.delete(users)

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

describe("db", (): void => {
  test("getAll", async (): Promise<void> => {
    const data = await DB.getAll()

    if (!Array.isArray(data)) {
      throw new Error("Incorrect return type")
    }

    expect(data).toHaveLength(1)
    expect(data[0]?.substances).toHaveLength(NUM_SUBSTANCES)
  })

  test("getList", async (): Promise<void> => {
    const data = await DB.getList(userId)

    if (typeof data !== "object") {
      throw new Error("Incorrect return type")
    }

    expect(data.userId).toBe(userId)

    expect(data.substances).toHaveLength(NUM_SUBSTANCES)
  })

  test("getDate - name", async (): Promise<void> => {
    const msg = await DB.getDate(userId, substanceName)

    expect(msg).toHaveLength(1)
    expect(msg[0]).toContain(substanceName)
  })

  test("getDate - all", async (): Promise<void> => {
    const msg = await DB.getDate(userId, "all")

    expect(msg).toHaveLength(NUM_SUBSTANCES)
    expect(msg).toEqual(expect.arrayContaining([expect.stringContaining(substanceName)]))
  })

  test("setData", (): void => {
    const date = dayjs(fake.date.past()).format(DATE_FORMAT)

    const substance = getSubstanceName()

    const msg = DB.setDate(userId, substanceName, date, substance)

    expect(msg).toContain(date)

    expect(msg).toContain(titleCase(substance))
  })

  test("resetDate", async (): Promise<void> => {
    const getSubstance = async (): Promise<ISubstance> => {
      assert(DB.instance)

      const [substance] = await DB.instance.select().from(substances).limit(1)

      if (!substance) {
        throw new Error("Invalid substance")
      }

      return substance
    }

    let sub = await getSubstance()

    const msg = await DB.resetDate(sub.userId, sub.name)

    const today = dayjs().format(DATE_FORMAT)

    expect(sub.date).not.toBe(today)

    expect(msg).toContain(titleCase(sub.name))

    sub = await getSubstance()

    expect(sub.date).toBe(today)
  })

  test("deleteDate - name", async (): Promise<void> => {
    const msg = await DB.deleteDate(userId, substanceName)

    expect(msg).toContain(titleCase(substanceName))

    assert(DB.instance)

    expect(await DB.instance.$count(substances, eq(substances.name, substanceName))).toBe(0)

    expect(await DB.instance.$count(substances, ne(substances.name, substanceName))).toBe(NUM_SUBSTANCES)
  })

  test("deleteDate - all", async (): Promise<void> => {
    const msg = await DB.deleteDate(userId, "all")

    expect(msg).toContain("All")

    assert(DB.instance)

    expect(await DB.instance.$count(users, eq(users.userId, userId))).toBe(0)

    expect(await DB.instance.$count(substances)).toBe(0)
  })
})

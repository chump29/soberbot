import { default as assert } from "node:assert/strict"

import { afterAll, beforeAll, describe, expect, test } from "bun:test"

import { fakerEN_US as fake } from "@faker-js/faker"
import { default as dayjs } from "dayjs"
import { eq, ne } from "drizzle-orm"
import { titleCase } from "title-case"

import { DATE_FORMAT, type ISubstance, type IUser, MAX_USER_ID_LEN, substances, users } from "../../db/schema.ts"
import { DB, type IData } from "../../utils/db.ts"
import { SUBSTANCES } from "../substances.ts"

const LEN: number = 2

const userId: string = fake.string.numeric({ allowLeadingZeros: false, length: MAX_USER_ID_LEN })
let name: string = ""

const getName = (): string => {
  let tmp: string = ""
  do {
    tmp = fake.helpers.arrayElement(SUBSTANCES)
  } while (tmp === name)
  if (name.length === 0) {
    name = tmp
  }
  return tmp
}
const getDate = (): string => dayjs(fake.date.past({ years: 10 })).format(DATE_FORMAT)

beforeAll(async (): Promise<void> => {
  DB.open()

  assert(DB._db)

  await DB._db.delete(users)

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
          { length: LEN },
          (): ISubstance => ({ userId, date: getDate(), name: getName() }) satisfies ISubstance
        )
      )
  })
})

afterAll((): void => {
  DB.close()
})

describe("db", (): void => {
  test("getAll", async (): Promise<void> => {
    const data: IData[] = (await DB.getAll()) as IData[]

    expect(data).toHaveLength(1)
    expect(data[0]?.substances).toHaveLength(LEN)
  })

  test("getList", async (): Promise<void> => {
    const data: IData = (await DB.getList(userId)) as IData

    expect(data.userId).toBe(userId)

    expect(data.substances.length).toBe(LEN)
  })

  test("getDate - name", async (): Promise<void> => {
    const msg: string = await DB.getDate(userId, name)

    expect(msg).toContain(name)
  })

  test("getDate - all", async (): Promise<void> => {
    const msg: string = await DB.getDate(userId, "all")

    expect(msg).toContain(name)
    expect(msg).toContain("\n")
  })

  test("setData", async (): Promise<void> => {
    const date: string = dayjs(fake.date.past()).format(DATE_FORMAT)

    const substance: string = getName()

    const msg: string = await DB.setDate(userId, name, date, substance)

    expect(msg).toContain(date)

    expect(msg).toContain(titleCase(substance))
  })

  test("resetDate", async (): Promise<void> => {
    assert(DB._db)

    const getSubstance = async (): Promise<ISubstance> => {
      assert(DB._db)

      const [substance]: ISubstance[] = (await DB._db.select().from(substances).limit(1)) as ISubstance[]

      return substance as ISubstance
    }

    let sub: ISubstance = await getSubstance()

    const msg: string = await DB.resetDate(sub.userId, sub.name)

    const today: string = dayjs().format(DATE_FORMAT)

    expect(sub.date).not.toBe(today)

    expect(msg).toContain(sub.name)

    sub = await getSubstance()

    expect(sub.date).toBe(today)
  })

  test("deleteDate - name", async (): Promise<void> => {
    const msg: string = await DB.deleteDate(userId, name)

    expect(msg).toContain(titleCase(name))

    assert(DB._db)

    expect(await DB._db.$count(substances, eq(substances.name, name))).toBe(0)

    expect(await DB._db.$count(substances, ne(substances.name, name))).toBe(LEN)
  })

  test("deleteDate - all", async (): Promise<void> => {
    const msg: string = await DB.deleteDate(userId, "all")

    expect(msg).toContain("All")

    assert(DB._db)

    expect(await DB._db.$count(users, eq(users.userId, userId))).toBe(0)

    expect(await DB._db.$count(substances)).toBe(0)
  })
})

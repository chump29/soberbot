import { join } from "node:path"

import { Database } from "bun:sqlite"

import { error, info } from "@postfmly/logger"
import { type Nullable } from "@postfmly/types"

import { default as pluralize } from "@jarrodek/pluralize"
import { default as dayjs } from "dayjs"
import { default as duration } from "dayjs/plugin/duration"
import { and, asc, eq, extractTablesFromSchema, sql } from "drizzle-orm"
import { drizzle, type SQLiteBunTransaction } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { titleCase } from "title-case"
import { safeParse } from "valibot"

import {
  DATE_FORMAT,
  type ISubstance,
  type IUser,
  relations,
  SubstanceSchema,
  substances,
  UserSchema,
  users
} from "../db/schema.ts"
import { env } from "./env.ts"

dayjs.extend(duration)

interface IRawData {
  date: Nullable<string>
  name: Nullable<string>
  userId: string
  userName: string
}

interface ISubstanceData {
  date: string
  name: string
  streak?: string
}

interface IData {
  substances: ISubstanceData[]
  userId?: string
  userName: string
}

interface ISoberBotDatabase {
  close: () => void
  deleteDate: (userId: string, name: string) => Promise<string>
  getAll: () => Promise<IData[] | string>
  getDate: (userId: string, name: string) => Promise<string[]>
  getList: (userId: string) => Promise<IData | string>
  readonly instance: Nullable<DBType>
  open: () => void
  resetDate: (userId: string, name: string) => Promise<string>
  setDate: (userId: string, userName: string, date: string, name: string) => string
}

const schema = extractTablesFromSchema({
  tables: { users, substances },
  relations
})

type DBType = ReturnType<typeof drizzle<typeof schema>>

type TxType = SQLiteBunTransaction<typeof schema>

class SoberBotDatabase implements ISoberBotDatabase {
  private client: Nullable<Database> = null
  instance: Nullable<DBType> = null

  open(): void {
    if (this.instance) {
      if (env.DEBUG) {
        info("⚠️  Database already open")
      }

      return
    }

    const dbPathName = join(env.DB_PATH, env.DB_NAME)

    this.client = new Database(dbPathName, {
      create: true,
      strict: true
    })

    this.client.run(`
      PRAGMA busy_timeout = 3000;
      PRAGMA foreign_keys = 1;
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA wal_checkpoint(TRUNCATE);
    `)

    this.instance = drizzle({
      client: this.client,
      jit: true,
      relations
    })

    migrate(this.instance, {
      migrationsFolder: env.DB_PATH
    })

    if (env.DEBUG) {
      info(`▶️  Using database: ${dbPathName}`)
    }
  }

  close(): void {
    if (!this.instance) {
      if (env.DEBUG) {
        info("⚠️  Database already closed")
      }

      return
    }

    this.client?.close()
    this.client = null

    this.instance = null

    if (env.DEBUG) {
      info("⏹️  Database closed")
    }
  }

  private dbCheck(): DBType {
    if (!this.instance) {
      throw new Error("Database not open")
    }

    return this.instance
  }

  // * /delete <name|all>
  async deleteDate(userId: string, name: string): Promise<string> {
    if (name.toLowerCase() === "all") {
      try {
        const [user] = await this.dbCheck()
          .delete(users)
          .where(eq(users.userId, userId))
          .returning({ userId: users.userId })

        if (!user) {
          // biome-ignore lint/suspicious/useErrorMessage: use custom message
          throw new Error()
        }
      } catch (e: unknown) {
        const msg = "❌ Could not delete all dates"

        error(msg, userId, e)

        return msg
      }

      return "✅ All dates deleted"
    }

    const titleName = titleCase(name)

    try {
      const [substance] = await this.dbCheck()
        .delete(substances)
        .where(eq(sql`lower(${substances.name})`, name.toLowerCase()))
        .returning({ userId: substances.userId })

      if (!substance) {
        return `❌ Date not found for ${titleName}`
      }
    } catch (e: unknown) {
      const msg = `❌ Could not delete date for ${titleName}`

      error(msg, titleName, e)

      return msg
    }

    return `✅ Date deleted for ${titleName}`
  }

  // * /reset <name>
  async resetDate(userId: string, name: string): Promise<string> {
    const titleName = titleCase(name)

    try {
      const [substance] = await this.dbCheck()
        .update(substances)
        .set({ date: dayjs().format(DATE_FORMAT) })
        .where(and(eq(substances.userId, userId), eq(sql`lower(${substances.name})`, name.toLowerCase())))
        .returning({ userId: substances.userId })

      if (!substance) {
        return `❌ Date not found for ${titleName}`
      }
    } catch (e: unknown) {
      const msg = `❌ Could not reset date for ${titleName}`

      error(msg, userId, e)

      return msg
    }

    return `Date reset for ${titleName}`
  }

  // * /set YYYY-MM-DD <name>
  setDate(userId: string, userName: string, date: string, name: string): string {
    const user = { userId, userName } satisfies IUser

    const u = safeParse(UserSchema, user)
    if (!u.success) {
      const msg = "❌ Could not create user"

      error(msg, user, u.issues[0].message)

      return msg
    }

    const substance = { userId, date, name } satisfies ISubstance

    const s = safeParse(SubstanceSchema, substance)
    if (!s.success) {
      const msg = "❌ Could not create substance"

      error(msg, substance, s.issues[0].message)

      return msg
    }

    const titleName = titleCase(name)

    try {
      this.dbCheck().transaction((tx: TxType): void => {
        tx.insert(users)
          .values({ userId, userName } satisfies IUser)
          .onConflictDoNothing()
          .run()

        tx.insert(substances)
          .values({ userId, date, name } satisfies ISubstance)
          .onConflictDoUpdate({
            set: { date },
            target: [substances.userId, substances.name]
          })
          .run()
      })
    } catch (e: unknown) {
      const msg = `❌ Could not set date for ${titleName}`

      error(msg, userId, e)

      return msg
    }

    return `✅ Date set to ${date} for ${titleName}`
  }

  static getStreak(date: string): string {
    const diff = dayjs.duration(dayjs().diff(dayjs(date)))

    const days = Math.floor(diff.asDays())

    return pluralize("day", days, true)
  }

  static format = (name: string, date: string): string => `${name}: ${SoberBotDatabase.getStreak(date)}`

  // * /streak <name|all>
  async getDate(userId: string, name: string): Promise<string[]> {
    if (name.toLowerCase() === "all") {
      try {
        const allSubstances = await this.dbCheck()
          .select({ date: substances.date, name: substances.name })
          .from(substances)
          .where(eq(substances.userId, userId))
          .orderBy(substances.date)

        if (allSubstances.length === 0) {
          return ["❌ Streak(s) not found"]
        }

        // biome-ignore lint/style/noNonNullAssertion: required
        return allSubstances.map((s: Partial<ISubstance>): string => SoberBotDatabase.format(s.name!, s.date!))
      } catch (e: unknown) {
        const msg = "❌ Could not get all streaks"

        error(msg, e)

        return [msg]
      }
    }

    const titleName = titleCase(name)

    try {
      const [substance] = await this.dbCheck()
        .select({ date: substances.date, name: substances.name })
        .from(substances)
        .where(and(eq(substances.userId, userId), eq(sql`lower(${substances.name})`, name.toLowerCase())))
        .limit(1)

      if (!substance) {
        return [`❌ Streak not found for ${titleName}`]
      }

      return [SoberBotDatabase.format(substance.name, substance.date)]
    } catch (e: unknown) {
      const msg = `❌ Could not get date for ${titleName}`

      error(msg, titleName, e)

      return [msg]
    }
  }

  private static convertData(data: IRawData[]): IData[] {
    const groups = new Map<string, IData>()

    for (const d of data) {
      let group = groups.get(d.userId)
      if (!group) {
        group = {
          substances: [],
          userId: d.userId,
          userName: d.userName
        }
        groups.set(d.userId, group)
      }

      if (d.date !== null && d.name !== null) {
        const s = {
          date: d.date,
          name: d.name,
          streak: SoberBotDatabase.getStreak(d.date)
        } satisfies ISubstanceData
        group.substances.push(s)
      }
    }

    return Array.from(groups.values())
  }

  // * /all
  async getAll(): Promise<IData[] | string> {
    try {
      const data: IRawData[] =
        (await this.dbCheck()
          .select({
            date: substances.date,
            name: substances.name,
            userId: users.userId,
            userName: users.userName
          })
          .from(users)
          .leftJoin(substances, eq(users.userId, substances.userId))
          .orderBy(asc(users.userName), asc(substances.name))) ?? []

      if (data.length === 0) {
        return "❌ No dates to display"
      }

      return SoberBotDatabase.convertData(data)
    } catch (e: unknown) {
      const msg = "❌ Could not get all dates"

      error(msg, e)

      return msg
    }
  }

  // * /list
  async getList(userId: string): Promise<IData | string> {
    try {
      const data: IRawData[] =
        (await this.dbCheck()
          .select({
            date: substances.date,
            name: substances.name,
            userId: users.userId,
            userName: users.userName
          })
          .from(users)
          .leftJoin(substances, eq(users.userId, substances.userId))
          .where(eq(users.userId, userId))
          .orderBy(asc(substances.name))) ?? []

      if (data.length === 0) {
        return "❌ No dates to display"
      }

      const [d] = SoberBotDatabase.convertData(data)
      if (!d) {
        throw new Error("Could not get data")
      }

      return d
    } catch (e: unknown) {
      const msg = "❌ Could not get list"

      error(msg, e)

      return msg
    }
  }
}

const DB = new SoberBotDatabase()

export { DB, type IData, type ISubstanceData, type TxType }

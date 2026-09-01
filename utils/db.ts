import { Database } from "bun:sqlite"

import { error, info } from "@postfmly/logger"
import { type Nullable } from "@postfmly/types"

import { default as pluralize } from "@jarrodek/pluralize"
import { default as dayjs } from "dayjs"
import { default as duration } from "dayjs/plugin/duration"
import { and, eq, sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { migrate } from "drizzle-orm/bun-sqlite/migrator"
import { titleCase } from "title-case"
import { type SafeParseResult, safeParse } from "valibot"

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
import { env } from "../env.ts"

dayjs.extend(duration)

// biome-ignore lint/nursery/useExplicitType: inferred
const { DB_NAME, DB_PATH, DEBUG } = env

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
  _db: Nullable<DBType>
  close: () => void
  deleteDate: (userId: string, name: string) => Promise<string>
  getAll: () => Promise<IData[] | string>
  getDate: (userId: string, name: string) => Promise<string>
  getList: (userId: string) => Promise<IData | string>
  open: () => void
  resetDate: (userId: string, name: string) => Promise<string>
  setDate: (userId: string, userName: string, date: string, name: string) => Promise<string>
}

const schema: Record<string, unknown> = {
  users,
  substances,
  relations
}

// @ts-expect-error: schema
type DBType = ReturnType<typeof drizzle<typeof schema>>

class SoberBotDatabase implements ISoberBotDatabase {
  private client: Nullable<Database> = null
  _db: Nullable<DBType> = null

  open(): void {
    if (this._db && DEBUG) {
      info("⚠️  Database already open")
      return
    }

    const dbPathName: string = `${DB_PATH}/${DB_NAME}`

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

    this._db = drizzle({
      client: this.client,
      jit: true,
      relations
    })

    migrate(this._db, {
      migrationsFolder: DB_PATH
    })

    if (DEBUG) {
      info(`▶️  Using database: ${dbPathName}`)
    }
  }

  close(): void {
    if (!this.client && DEBUG) {
      info("⚠️  Database already closed")
      return
    }

    this.client?.close()

    this.client = null
    this._db = null

    if (DEBUG) {
      info("⏹️  Database closed")
    }
  }

  private dbCheck(): DBType {
    if (!this._db) {
      throw new Error("Database not open")
    }

    return this._db
  }

  // * /delete <name|all>
  async deleteDate(userId: string, name: string): Promise<string> {
    if (name.toLowerCase() === "all") {
      try {
        const [user]: Partial<IUser>[] = await this.dbCheck()
          .delete(users)
          .where(eq(users.userId, userId))
          .returning({ userId: users.userId })

        if (!user) {
          // biome-ignore lint/suspicious/useErrorMessage: use custom message
          throw new Error()
        }
      } catch (e: unknown) {
        const msg: string = "❌ Could not delete all dates"
        error(msg, userId, e)
        return msg
      }

      return "✅ All dates deleted"
    }

    const titleName: string = titleCase(name)

    try {
      const [substance]: Partial<ISubstance>[] = await this.dbCheck()
        .delete(substances)
        .where(eq(sql`lower(${substances.name})`, name.toLowerCase()))
        .returning({ userId: substances.userId })

      if (!substance) {
        return `❌ Date not found for ${titleName}`
      }
    } catch (e: unknown) {
      const msg: string = `❌ Could not delete date for ${titleName}`
      error(msg, titleName, e)
      return msg
    }

    return `✅ Date deleted for ${titleName}`
  }

  // * /reset <name>
  async resetDate(userId: string, name: string): Promise<string> {
    const titleName: string = titleCase(name)

    try {
      const [substance]: Partial<ISubstance>[] = await this.dbCheck()
        .update(substances)
        .set({ date: dayjs().format(DATE_FORMAT) } as ISubstance)
        .where(and(eq(substances.userId, userId), eq(sql`lower(${substances.name})`, name.toLowerCase())))
        .returning({ userId: substances.userId })

      if (!substance) {
        return `❌ Date not found for ${titleName}`
      }
    } catch (e: unknown) {
      const msg: string = `❌ Could not reset date for ${titleName}`
      error(msg, userId, e)
      return msg
    }

    return `Date reset for ${titleName}`
  }

  // * /set YYYY-MM-DD <name>
  async setDate(userId: string, userName: string, date: string, name: string): Promise<string> {
    const user: IUser = { userId, userName } satisfies IUser

    const u: SafeParseResult<UserSchema> = safeParse(UserSchema, user)
    if (!u.success) {
      const msg: string = "❌ Could not create user"
      error(msg, user, u.issues[0].message)
      return msg
    }

    const substance: ISubstance = { userId, date, name } satisfies ISubstance

    const s: SafeParseResult<SubstanceSchema> = safeParse(SubstanceSchema, substance)
    if (!s.success) {
      const msg: string = "❌ Could not create substance"
      error(msg, substance, s.issues[0].message)
      return msg
    }

    const titleName: string = titleCase(name)

    try {
      // @ts-expect-error: no types
      await this.dbCheck().transaction(async (tx) => {
        await tx
          .insert(users)
          .values({ userId, userName } satisfies IUser)
          .onConflictDoNothing()

        await tx
          .insert(substances)
          .values({ userId, date, name } satisfies ISubstance)
          .onConflictDoUpdate({
            set: { date } as ISubstance,
            target: [substances.userId, substances.name]
          })
      })
    } catch (e: unknown) {
      const msg: string = `❌ Could not set date for ${titleName}`
      error(msg, userId, e)
      return msg
    }

    return `✅ Date set to ${date} for ${titleName}`
  }

  static getStreak(date: string): string {
    const diff: duration.Duration = dayjs.duration(dayjs().diff(dayjs(date)))

    const days: number = Math.floor(diff.asDays())

    return pluralize("day", days, true)
  }

  // * /streak <name|all>
  async getDate(userId: string, name: string): Promise<string> {
    if (name.toLowerCase() === "all") {
      try {
        const allSubstances: Partial<ISubstance>[] = await this.dbCheck()
          .select({ date: substances.date, name: substances.name })
          .from(substances)
          .where(eq(substances.userId, userId))

        if (allSubstances.length === 0) {
          return "❌ Streak(s) not found"
        }

        return allSubstances
          .map(
            (s: Partial<ISubstance>): string => `-# 🔥 ${s.name}: **${SoberBotDatabase.getStreak(s.date as string)}**`
          )
          .join("\n")
      } catch (e: unknown) {
        const msg: string = "❌ Could not get all streaks"
        error(msg, e)
        return msg
      }
    }

    const titleName: string = titleCase(name)

    try {
      const [substance]: Partial<ISubstance>[] = await this.dbCheck()
        .select({ date: substances.date, name: substances.name })
        .from(substances)
        .where(and(eq(substances.userId, userId), eq(sql`lower(${substances.name})`, name.toLowerCase())))
        .limit(1)

      if (!substance) {
        return `❌ Streak not found for ${titleName}`
      }

      return `-# 🔥 ${substance.name}: **${SoberBotDatabase.getStreak(substance.date as string)}**`
    } catch (e: unknown) {
      const msg: string = `❌ Could not get date for ${titleName}`
      error(msg, titleName, e)
      return msg
    }
  }

  // * /all
  async getAll(): Promise<IData[] | string> {
    try {
      const data: IData[] =
        // @ts-expect-error: undefined
        (await this.dbCheck().query.users.findMany({
          orderBy: { userName: "asc" },
          columns: {
            userName: true
          },
          with: {
            substances: {
              orderBy: { date: "desc" },
              columns: {
                date: true,
                name: true
              }
            }
          }
        })) ?? []

      if (data.length === 0) {
        return "❌ No dates to display"
      }

      return data.map(
        (d: IData): IData => ({
          ...d,
          substances: d.substances.map(
            (s: ISubstanceData): ISubstanceData => ({
              ...s,
              streak: SoberBotDatabase.getStreak(s.date)
            })
          )
        })
      )
    } catch (e: unknown) {
      const msg: string = "❌ Could not get all dates"
      error(msg, e)
      return msg
    }
  }

  // * /list
  async getList(userId: string): Promise<IData | string> {
    try {
      // @ts-expect-error: type
      const data: Nullable<IData> =
        // @ts-expect-error: undefined
        (await this.dbCheck().query.users.findFirst({
          orderBy: { userName: "asc" },
          columns: {
            userId: true,
            userName: true
          },
          where: {
            // @ts-expect-error: type
            userId
          },
          with: {
            substances: {
              orderBy: { date: "desc" },
              columns: {
                date: true,
                name: true
              }
            }
          }
        })) ?? null

      if (!data) {
        return "❌ No dates to display"
      }

      data.substances = data.substances.map(
        (s: ISubstanceData): ISubstanceData => ({
          ...s,
          streak: SoberBotDatabase.getStreak(s.date)
        })
      )

      return data as IData
    } catch (e: unknown) {
      const msg: string = "❌ Could not get list"
      error(msg, e)
      return msg
    }
  }
}

const DB: ISoberBotDatabase = new SoberBotDatabase()

export { DB, type IData, type ISubstanceData }

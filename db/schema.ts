import { default as dayjs } from "dayjs"
import { defineRelations } from "drizzle-orm"
import { integer, snakeCase, text, unique } from "drizzle-orm/sqlite-core"
import { createInsertSchema } from "drizzle-orm/valibot"
import { type GenericSchema, isoDate, maxLength, maxValue, minLength, nonEmpty, pipe, string, trim } from "valibot"

const MIN_NAME_LEN: number = 1
const MAX_NAME_LEN: number = 30
const MAX_USER_ID_LEN: number = 19
const MAX_USER_NAME_LEN: number = 32

const DATE_FORMAT: string = "YYYY-MM-DD"

const StringSchema = pipe(string(), trim(), nonEmpty())

const users = snakeCase.table("users", {
  id: integer().primaryKey(),
  userId: text({ length: MAX_USER_ID_LEN }).notNull().unique(),
  userName: text({ length: MAX_USER_NAME_LEN }).notNull()
})

type IUser = Omit<typeof users.$inferSelect, "id">

const UserSchema = createInsertSchema(users, {
  userId: (): GenericSchema => pipe(StringSchema, maxLength(MAX_USER_ID_LEN)),
  userName: (): GenericSchema => pipe(StringSchema, maxLength(MAX_USER_NAME_LEN))
})

type UserSchema = typeof UserSchema

const substances = snakeCase.table(
  "substances",
  {
    date: text({ length: DATE_FORMAT.length }).notNull(),
    id: integer().primaryKey(),
    name: text({ length: MAX_NAME_LEN }).notNull(),
    userId: text({ length: MAX_USER_ID_LEN })
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" })
  },
  (table) => [unique("idx_user_id_name").on(table.userId, table.name)]
)

type ISubstance = Omit<typeof substances.$inferSelect, "id">

const SubstanceSchema = createInsertSchema(substances, {
  date: (): GenericSchema =>
    pipe(StringSchema, isoDate(), maxLength(DATE_FORMAT.length), maxValue(dayjs().format(DATE_FORMAT))),
  name: (): GenericSchema => pipe(StringSchema, minLength(MIN_NAME_LEN), maxLength(MAX_NAME_LEN))
})

type SubstanceSchema = typeof SubstanceSchema

const relations = defineRelations({ users, substances }, (fk) => ({
  substances: {
    user: fk.one.users({
      from: fk.substances.userId,
      to: fk.users.userId
    })
  },
  users: {
    substances: fk.many.substances()
  }
}))

export {
  DATE_FORMAT,
  type ISubstance,
  type IUser,
  MAX_NAME_LEN,
  MAX_USER_ID_LEN,
  MIN_NAME_LEN,
  relations,
  SubstanceSchema,
  substances,
  UserSchema,
  users
}

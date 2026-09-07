import { parse } from "node:path"

import {
  type APIEmbedField,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type HexColorString,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { DB, type IData, type ISubstanceData } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"
import { type IEnv } from "../../utils/IEnv.ts"

const { COLOR, NAME }: IEnv = env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.filename).name)
    .setDescription("List streaks")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const getFields = (data: IData): APIEmbedField[] => {
  const fields: APIEmbedField[] = []

  if (data.substances.length === 0) {
    fields.push({
      name: "🚫  Nothing to show",
      value: ""
    } as APIEmbedField)
  } else {
    fields.push({
      inline: true,
      name: "_ _",
      value: data.substances.map((s: ISubstanceData): string => `${s.name}: ${s.date} (${s.streak})`).join("\n")
    } as APIEmbedField)
  }

  return fields
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await DB.getList(interaction.user.id).then(async (msg: IData | string): Promise<void> => {
    if (typeof msg === "string") {
      await interaction.reply({
        content: `-# > ❌ ${msg as string}`,
        flags: MessageFlags.Ephemeral
      })
    } else {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        embeds: [
          new EmbedBuilder()
            .setColor(COLOR as HexColorString)
            .setTitle(`${NAME} Dates for ${interaction.user.displayName}`)
            .setFields(getFields(msg))
            .toJSON()
        ]
      })
    }
  })
}

export { create, invoke }

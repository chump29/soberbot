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

import { env } from "../../env.ts"
import { DB, type IData, type ISubstanceData } from "../../utils/db.ts"

// biome-ignore lint/nursery/useExplicitType: inferred
const { COLOR, NAME } = env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("List all streaks")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const getFields = (data: IData[]): APIEmbedField[] => {
  const fields: APIEmbedField[] = []

  if (data.length === 0) {
    fields.push({
      name: "🚫  Nothing to show",
      value: ""
    } as APIEmbedField)
  } else {
    for (const d of data) {
      fields.push({
        inline: true,
        name: d.userName,
        value: d.substances.map((s: ISubstanceData): string => `${s.name}: ${s.date} (${s.streak})`).join("\n")
      } as APIEmbedField)
    }
  }

  return fields
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await DB.getAll().then(async (msg: IData[] | string): Promise<void> => {
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
            .setTitle(`${NAME} Dates`)
            .setFields(getFields(msg))
            .toJSON()
        ]
      })
    }
  })
}

export { create, invoke }

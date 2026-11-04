import { parse } from "node:path"

import {
  type APIEmbedField,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { DB, type IData, type ISubstanceData } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

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
    } satisfies APIEmbedField)
  } else {
    for (const d of data) {
      fields.push({
        inline: true,
        name: d.userName,
        value: d.substances.map((s: ISubstanceData): string => `${s.name}: ${s.date} (${s.streak})`).join("\n")
      } satisfies APIEmbedField)
    }
  }

  return fields
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  const msg = await DB.getAll()

  if (typeof msg === "string") {
    const m: string = msg // narrow

    await interaction.editReply({ content: `-# > ${m}` })
  } else {
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(env.COLOR).setTitle(`${env.NAME} Dates`).setFields(getFields(msg)).toJSON()]
    })
  }
}

export { create, invoke }

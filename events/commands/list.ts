import { parse } from "node:path"

import {
  type APIEmbedField,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type HexColorString,
  InteractionContextType,
  MessageFlags,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { bucket } from "../../utils/bucket.ts"
import { DB, type IData, type ISubstanceData } from "../../utils/db.ts"
import { env } from "../../utils/env.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("List streaks")
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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.username)) {
    await interaction.editReply({ content: "-# > ❌ Rate limit exceeded" })

    return
  }

  await DB.getList(interaction.user.id).then(async (msg: IData | string): Promise<void> => {
    if (typeof msg === "string") {
      await interaction.editReply({ content: `-# > ${msg as string}` })
    } else {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(env.COLOR as HexColorString)
            .setTitle(`${env.NAME} Dates for ${interaction.user.displayName}`)
            .setFields(getFields(msg))
            .toJSON()
        ]
      })
    }
  })
}

export { create, invoke }

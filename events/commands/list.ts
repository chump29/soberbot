import { parse } from "node:path"

import {
  type APIEmbedField,
  type ChatInputCommandInteraction,
  EmbedBuilder,
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
    } satisfies APIEmbedField)
  } else {
    fields.push({
      inline: true,
      name: "_ _",
      value: data.substances.map((s: ISubstanceData): string => `${s.name}: ${s.date} (${s.streak})`).join("\n")
    } satisfies APIEmbedField)
  }

  return fields
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.username)) {
    await interaction.editReply({ content: "-# > ❌ Rate limit exceeded" })

    return
  }

  const msg = await DB.getList(interaction.user.id)

  if (typeof msg === "string") {
    const m: string = msg

    await interaction.editReply({ content: `-# > ${m}` })
  } else {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(env.COLOR)
          .setTitle(`${env.NAME} Dates for ${interaction.user.displayName}`)
          .setFields(getFields(msg))
          .toJSON()
      ]
    })
  }
}

export { create, invoke }

import { parse } from "node:path"

import { checkRate } from "@postfmly/checkrate"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandStringOption
} from "discord.js"

import { MAX_NAME_LEN, MIN_NAME_LEN } from "../../db/schema.ts"
import { DB } from "../../utils/db.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.filename).name)
    .setDescription("Delete substance date")
    .addStringOption(
      (option: SlashCommandStringOption): SlashCommandStringOption =>
        option
          .setName("name")
          .setDescription("Substance or ALL")
          .setRequired(true)
          .setMinLength(MIN_NAME_LEN)
          .setMaxLength(MAX_NAME_LEN)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  await DB.deleteDate(interaction.user.id, (interaction.options.getString("name") as string).trim()).then(
    async (msg: string): Promise<void> => {
      await interaction.editReply({ content: `-# > ${msg}` })
    }
  )
}

export { create, invoke }

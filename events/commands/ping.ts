import { parse } from "node:path"

import { checkRate } from "@postfmly/checkrate"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { env } from "../../utils/env.ts"

const { NAME } = env as typeof env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.filename).name)
    .setDescription(`Ping ${NAME}`)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  await interaction.editReply({
    content: `-# > **Pong!** ⚡ Your latency is: \`${Date.now() - interaction.createdTimestamp}ms\``
  })
}

export { create, invoke }

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
import { type IEnv } from "../../utils/IEnv.ts"

const { NAME }: IEnv = env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(Bun.env.file).name)
    .setDescription(`Ping ${NAME}`)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await interaction.reply({
    content: `-# > **Pong!** ⚡ Your latency is: \`${Date.now() - interaction.createdTimestamp}ms\``,
    flags: MessageFlags.Ephemeral
  })
}

export { create, invoke }

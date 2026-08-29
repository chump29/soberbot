import { parse } from "node:path"

import {
  type ChatInputCommandInteraction,
  EmbedBuilder,
  type HexColorString,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder
} from "discord.js"

import { checkRate } from "@postfmly/checkrate"

import { env } from "../../env.ts"
import { version } from "../../package.json" with { type: "json" }

// biome-ignore lint/nursery/useExplicitType: inferred
const { LOGO_URL, NAME, COLOR } = env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription(`Information about ${NAME}`)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR as HexColorString)
        .setAuthor({
          iconURL: LOGO_URL,
          name: `${NAME} v${version}`
        })
        .setThumbnail(LOGO_URL)
        .setDescription("- Handles sober dates")
        .setFooter({
          text: "By Chris Post"
        })
    ]
  })
}

export { create, invoke }

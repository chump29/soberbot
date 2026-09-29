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

import { bucket } from "../../index.ts"
import { author, version } from "../../package.json" with { type: "json" }
import { env } from "../../utils/env.ts"

const { LOGO_URL, NAME, COLOR } = env as typeof env

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.filename).name)
    .setDescription(`Information about ${NAME}`)
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.username)) {
    await interaction.editReply({ content: "❌ Rate limit exceeded" })

    return
  }

  await interaction.editReply({
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
          text: `By ${author.name}`
        })
    ]
  })
}

export { create, invoke }

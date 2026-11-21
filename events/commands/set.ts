import { parse } from "node:path"

import { default as dayjs } from "dayjs"
import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandIntegerOption,
  type SlashCommandStringOption
} from "discord.js"

import { DATE_FORMAT, MAX_NAME_LEN, MIN_NAME_LEN } from "../../db/schema.ts"
import { bucket } from "../../utils/bucket.ts"
import { DB } from "../../utils/db.ts"

const YEARS_AGO = 100

const MIN_MONTH = 1
const MAX_MONTH = 12

const MIN_DAY = 1
const MAX_DAY = 31

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
    .setDescription("Set substance date")
    .addIntegerOption(
      (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
        option
          .setName("year")
          .setDescription("Year")
          .setRequired(true)
          .setMinValue(dayjs().subtract(YEARS_AGO, "years").year())
          .setMaxValue(dayjs().year())
    )
    .addIntegerOption(
      (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
        option.setName("month").setDescription("Month").setRequired(true).setMinValue(MIN_MONTH).setMaxValue(MAX_MONTH)
    )
    .addIntegerOption(
      (option: SlashCommandIntegerOption): SlashCommandIntegerOption =>
        option.setName("day").setDescription("Day").setRequired(true).setMinValue(MIN_DAY).setMaxValue(MAX_DAY)
    )
    .addStringOption(
      (option: SlashCommandStringOption): SlashCommandStringOption =>
        option
          .setName("name")
          .setDescription("Substance")
          .setRequired(true)
          .setMinLength(MIN_NAME_LEN)
          .setMaxLength(MAX_NAME_LEN)
    )
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.id)) {
    await interaction.editReply({ content: "-# > ❌ Rate limit exceeded" })

    return
  }

  const date = dayjs(
    `${interaction.options.getInteger("year")}-${interaction.options.getInteger("month")}-${interaction.options.getInteger("day")}`
  )

  if (date.isAfter(dayjs())) {
    await interaction.editReply({ content: `-# > ❌ Date must be before or equal to ${dayjs().format(DATE_FORMAT)}` })

    return
  }

  // biome-ignore lint/style/noNonNullAssertion: required
  const name = interaction.options.getString("name")!.trim()

  await interaction.editReply({
    content: `-# > ${DB.setDate(interaction.user.id, interaction.user.displayName, date.format(DATE_FORMAT), name)}`
  })
}

export { create, invoke }

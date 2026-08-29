import { parse } from "node:path"

import {
  type ChatInputCommandInteraction,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandIntegerOption,
  type SlashCommandStringOption
} from "discord.js"

import { checkRate } from "@postfmly/checkrate"

import { default as dayjs } from "dayjs"

import { DATE_FORMAT, MAX_NAME_LEN, MIN_NAME_LEN } from "../../db/schema.ts"
import { DB } from "../../utils/db.ts"

const YEARS_AGO: number = 100

const MIN_MONTH: number = 1
const MAX_MONTH: number = 12

const MIN_DAY: number = 1
const MAX_DAY: number = 31

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
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
    .setContexts(InteractionContextType.Guild)
    .toJSON()

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  const date: dayjs.Dayjs = dayjs(
    `${interaction.options.getInteger("year")}-${interaction.options.getInteger("month")}-${interaction.options.getInteger("day")}`
  )

  if (date.isAfter(dayjs())) {
    await interaction.reply({
      content: `-# > ❌ Date must be before or equal to ${dayjs().format(DATE_FORMAT)}`,
      flags: MessageFlags.Ephemeral
    })

    return
  }

  await DB.setDate(
    interaction.user.id,
    interaction.user.displayName,
    date.format(DATE_FORMAT),
    interaction.options.getString("name") as string
  ).then(async (msg: string): Promise<void> => {
    await interaction.reply({
      content: `-# > ${msg}`,
      flags: MessageFlags.Ephemeral
    })
  })
}

export { create, invoke }

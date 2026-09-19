// cSpell: ignore sniglet

import { parse } from "node:path"

import { checkRate } from "@postfmly/checkrate"

import { mostReadable, random as randomColor, TinyColor } from "@ctrl/tinycolor"
import { Canvas, type CanvasRenderingContext2D, registerFont } from "canvas"
import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  InteractionContextType,
  type InteractionReplyOptions,
  MessageFlags,
  PermissionFlagsBits,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandStringOption
} from "discord.js"
import { default as ShortUniqueId } from "short-unique-id"

import { MAX_NAME_LEN, MIN_NAME_LEN } from "../../db/schema.ts"
import { DB } from "../../utils/db.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.filename).name)
    .setDescription("Get substance streak(s)")
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

const fontName: string = "Sniglet"
registerFont(`./utils/images/${fontName}.ttf`, { family: fontName })
const fontSize: number = 16
const fontStyle: string = `${fontSize}px ${fontName}`

const padding: number = 5

const wOffset: number = padding * 2

const rowH: number = fontSize + padding * 2

const radius: number = 20

const tmp: CanvasRenderingContext2D = new Canvas(1, 1).getContext("2d")
tmp.font = fontStyle

const icon: string = "🔥 "
const iconWidth: number = tmp.measureText(icon).width

const whiteOrBlack = (color: string): string => (new TinyColor(color).isLight() ? "black" : "white")

const createImage = (txt: string[]): AttachmentBuilder => {
  const w: number = Math.max(
    ...txt.map((t: string): number => iconWidth + tmp.measureText(t).width + wOffset * 2 + padding)
  )

  const h: number = rowH * txt.length

  const img: Canvas = new Canvas(w, h)
  const ctx: CanvasRenderingContext2D = img.getContext("2d")

  const bgColor: string = randomColor().toHexString()
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(0, 0, w, h, radius)
  ctx.fill()

  const txtColor: string = whiteOrBlack(bgColor)

  ctx.font = fontStyle
  ctx.textBaseline = "middle"

  ctx.fillStyle = mostReadable(bgColor, ["red", "yellow"])?.toHexString() ?? txtColor
  ctx.fillText(icon, wOffset, h / 2)

  ctx.fillStyle = txtColor
  for (let i = 0; i < txt.length; i++) {
    let y = i * rowH + rowH / 2
    if (txt.length > 1) {
      y += i === 0 ? padding : -padding
    }
    ctx.fillText(txt[i] as string, iconWidth + wOffset, y)
  }

  return new AttachmentBuilder(img.toBuffer("image/png"), {
    name: `soberbot_streak_${new ShortUniqueId({ length: 11 }).rnd()}.png`
  })
}

const invoke = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  if (await checkRate(interaction)) {
    return
  }

  await DB.getDate(interaction.user.id, (interaction.options.getString("name") as string).trim()).then(
    async (msg: string[]): Promise<void> => {
      if (!msg[0]) {
        await interaction.reply({
          content: "-# > ❌ Invalid response",
          flags: MessageFlags.Ephemeral
        })

        return
      }

      const isError: boolean = msg[0].startsWith("❌")

      const reply: InteractionReplyOptions = {
        flags: isError ? MessageFlags.Ephemeral : MessageFlags.SuppressNotifications
      }

      if (isError) {
        reply.content = `-# > ${msg[0]}`
      } else {
        reply.files = [createImage(msg)]
      }

      await interaction.reply(reply)
    }
  )
}

export { create, invoke }

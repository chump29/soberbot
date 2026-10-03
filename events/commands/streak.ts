import { parse } from "node:path"

import { mostReadable, random as randomColor, TinyColor } from "@ctrl/tinycolor"
import { Canvas, type CanvasRenderingContext2D, registerFont } from "canvas"
import {
  AttachmentBuilder,
  type ChatInputCommandInteraction,
  InteractionContextType,
  type InteractionEditReplyOptions,
  MessageFlags,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  type SlashCommandStringOption
} from "discord.js"
import { default as ShortUniqueId } from "short-unique-id"

import { MAX_NAME_LEN, MIN_NAME_LEN } from "../../db/schema.ts"
import { bucket } from "../../utils/bucket.ts"
import { DB } from "../../utils/db.ts"

const create = (): RESTPostAPIChatInputApplicationCommandsJSONBody =>
  new SlashCommandBuilder()
    .setName(parse(import.meta.file).name)
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

const blackOrWhite = (color: string): "black" | "white" => (new TinyColor(color).isLight() ? "black" : "white")

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

  const txtColor: string = blackOrWhite(bgColor)

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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!bucket.allow(interaction.user.username)) {
    await interaction.editReply({ content: "❌ Rate limit exceeded" })

    return
  }

  await DB.getDate(interaction.user.id, (interaction.options.getString("name") as string).trim()).then(
    async (msg: string[]): Promise<void> => {
      if (!msg[0]) {
        await interaction.editReply({ content: "-# > ❌ Invalid response" })

        return
      }

      const isError: boolean = msg[0].startsWith("❌")

      const reply: InteractionEditReplyOptions = {}

      if (isError) {
        reply.content = `-# > ${msg[0]}`
      } else {
        reply.files = [createImage(msg)]
      }

      await interaction.editReply(reply)
    }
  )
}

export { create, invoke }

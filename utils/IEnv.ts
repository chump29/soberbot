interface IEnv {
  CHANNEL_ID: string
  COLOR: string
  DB_NAME: string
  DB_PATH: string
  DEBUG: boolean
  LOGO_NAME: string
  LOGO_PATH: string
  LOGO_PORT: number | "random"
  LOGO_URL: string
  NAME: string
  TOKEN: string
}

export { type IEnv }

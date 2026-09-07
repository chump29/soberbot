declare module "bun" {
  interface Env {
    /** Absolute path to the directory containing the source file, without a trailing slash */
    dir: string
    /** Filename of the source file */
    file: string
  }
}

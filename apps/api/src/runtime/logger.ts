export type RuntimeLogger = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

export const runtimeLogger: RuntimeLogger = {
  info(message) {
    console.log(message)
  },
  warn(message) {
    console.warn(message)
  },
  error(message) {
    console.error(message)
  },
}

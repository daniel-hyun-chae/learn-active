export type WorkerExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => void
  passThroughOnException: () => void
}

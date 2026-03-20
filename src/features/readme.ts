import { FileController } from "../lib/file-controller"
import type { AppServerOnWsOpen } from "../lib/server"
import { EventEmitter, RPCMethods, type EventPublisherFn } from "../lib/ws-core"

export async function ReadmeMd(config: {
  path: string,
  publisherFn: EventPublisherFn,

}) {
  const { emitter, events } = EventEmitter<{
    'readme-md-updated': string
  }>()

  const file = FileController(
    config.path,
    async (file) => file.text(),
    async (file, data) => file.write(data),
    true
  )
  await file.initialize()
  file.subscribe(content => emitter(config.publisherFn).emit("readme-md-updated", content))

  const methods = RPCMethods({
    "getReadmeMd": () => { file.get() },
    "updateReadmeMd": async (content: string) => { await file.set(content) },
  })

  const onWsOpen: AppServerOnWsOpen = (ws) => {
    emitter(ws.send).emit("readme-md-updated", file.get())
  }

  return {
    events,
    methods,
    cleanup() { file.cleanup() },
    onWsOpen,
  }
}
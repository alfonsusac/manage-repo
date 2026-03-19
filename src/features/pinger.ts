import { nanoid } from "nanoid"
import { EventEmitter, type EventPublisherFn } from "../lib/ws-core"

export function Pinger(
  publishFn: EventPublisherFn
) {
  const { emitter, events } = EventEmitter<{
    "ping": string,
  }>()

  let intervalId: NodeJS.Timeout = null as any
  intervalId = setInterval(() => {
    emitter(publishFn).emit("ping", "ping " + nanoid(3))
  }, 1000)
  
  return {
    events: events,
    cleanup() { clearInterval(intervalId) }
  }
}
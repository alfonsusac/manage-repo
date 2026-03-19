import { EventListener, Listener } from "./util-listener"
import type { ServerEventPayload } from "./ws-core"
import { getErrorMessage } from "./util-get-error-message"
import { newStore, useQuery, type Store } from "./react-store"
import type { MaybePromise } from "bun"

// Strategy:
// - instantiate ws client in App, pass it down via context
// - ws client has subscribe func that listens to serverEvent broadcast
// - ws client automatically parses data onMessage
// - useWS -> read from context, return subscribe to eventObject func, return ws client instance


export function createAppClient<
  E extends Record<string, any>
>() {

  // ws event part
  // const id = Math.random().toString(16).slice(2, 6)
  // console.log("Creating AppClient with wsurl:", wsurl, `[${ id }]`)
  let ws: WebSocket | undefined
  const event = new EventListener<{ [ K in keyof E ]: [ data: E[ K ] ] }>()
  const wsevent = newStore(() => ws?.readyState)

  // ws.onopen = () => {
  //   wsevent.update(ws.readyState)
  // }
  // ws.onclose = () => {
  //   wsevent.update(ws.readyState)
  // }
  // ws.onmessage = e => {
  //   try {
  //     const data = JSON.parse(e.data) as ServerEventPayload
  //     event.emit(data.event, data.data)
  //   } catch (error) {
  //     console.error("ws) failed to parse message", getErrorMessage(error))
  //   }
  // }

  function initialize(wsurl: string) {
    const _ws = new WebSocket(wsurl)
    wsevent.update(_ws.readyState)
    _ws.onopen = () => {
      wsevent.update(_ws.readyState)
    }
    _ws.onclose = () => {
      wsevent.update(_ws.readyState)
    }
    _ws.onmessage = e => {
      try {
        const data = JSON.parse(e.data) as ServerEventPayload
        event.emit(data.event, data.data)
        if ("event" in data === false || "data" in data === false) {
          console.warn("ws) received message with unexpected format:", data)
        }
      } catch (error) {
        console.error("ws) failed to parse message", getErrorMessage(error))
      }
    }
    ws = _ws
  }


  function cleanup() {
    ws && ws.close()
    ws && (ws.onopen = null)
    ws && (ws.onclose = null)
    ws && (ws.onmessage = null)
    event.clear()
    wsevent.cleanup()
  }
  function subscribe<K extends keyof E>(eventName: K, handler: (data: E[ K ]) => void) {
    const cleanup = event.subscribe(eventName, handler)
    return () => cleanup()
  }
  function length<K extends keyof E>(eventName: K) {
    return event.length(eventName)
  }

  return {
    cleanup, subscribe, instance: ws, length, wsevent, initialize,
  }
}

export type AppClient<E extends Record<string, any>> = ReturnType<typeof createAppClient<E>>



// Server Publisher
//  Publisher abstraction that can be used to publish messages to a channel 
//  without needing to know about the underlying WebSocket implementation

import type { MaybePromise } from "bun"

export function ServerPublisher<P extends any[]>(
  channel: string,
  encoder: ((...data: P) => string | Buffer<ArrayBuffer>)
) {
  let _server: Bun.Server<undefined> | undefined = undefined
  function subscribe(ws: Bun.ServerWebSocket) {
    ws.subscribe(channel)
  }
  function unsubscribe(ws: Bun.ServerWebSocket) {
    ws.unsubscribe(channel)
  }
  function publish(...message: P) {
    if (!_server) throw new Error("ServerPublisher is not initialized")
    _server.publish(channel, encoder(...message))
  }
  function setServer(server: Bun.Server<undefined>) {
    if (_server) throw new Error("ServerPublisher is already initialized")
    _server = server
  }
  return { subscribe, unsubscribe, publish, setServer }
}

export type ServerPublisher = ReturnType<typeof ServerPublisher>





// Server Event
//  An abstraction layer that defines all event payloads as { event: string, data: any }.
//  This allows us to have a consistent event structure across the application and makes 
//  it easier to handle events on the client side.

export type ServerEventPayload = { event: string, data: any }
export type EventPublisherSchema = { [ E in string ]: (...args: any) => void }
export type ServerEventPublisher = ReturnType<typeof ServerEventPublisher>
export function ServerEventPublisher(opts: {
  channel: string,
  onPublish?: (payload: { evName: string, data: any }) => any
}) {
  return ServerPublisher(
    opts.channel,
    (evName: string, data: any) => {
      opts.onPublish?.({ evName, data })
      return JSON.stringify({ event: evName, data } satisfies ServerEventPayload)
    }
  )
}

export type EventMap = { [ E in string ]: any }
export type EventPublisherFn = (evName: string, ...data: any) => void
export function EventEmitter<
  P extends { [ E in string ]: any }
>() {
  return {
    emitter: (publisherFn: EventPublisherFn) => {
      return {
        publish: <N extends keyof P & string>(name: N, data: P[ N ]) => {
          publisherFn(name, data)
        },
      }
    },
    events: {} as P
  }
}

export type Publishings = Record<string, (evName: string, ...args: any) => void>





// RPC Handler
//  An abstraction layer for handling RPC calls over fetch. 

export type RPCPayloadIn = { name: string, args: any }
export type RPCPayloadOut = { result: any }
export type RPCMethods = Record<string, (...args: any) => MaybePromise<any>>
export function RPCMethods<F extends RPCMethods>(methods: F): F { return methods }

export function RPCFetchHandlers<
  F extends RPCMethods
>(opts: {
  methods: F
}) {
  const routeMap = {
    "/rpc": async (req: Bun.BunRequest<"/rpc">) => {
      try {
        const body = await req.json() as RPCPayloadIn
        const name = body.name
        const args = body.args
        if (name in opts.methods === false)
          throw new Error("unknown rpc method: " + name)
        const result = await opts.methods[ name ](...args)
        return Response.json({ result: result })
      } catch (error) {
        console.error("error handling RPC fetch request:", error)
        return new Response("server error occured", { status: 500 })
      }
    }
  }

  return {
    routeMap,
    methods: opts.methods
  }
}





// App Server
//  A high level abstraction that defines the structure of the application server. 
//  It includes RPC methods, event publishers, and a lifecycle hook for when the server
//  is started.

export type AppServer = {
  rpcMethods: Record<string, (...args: any) => MaybePromise<any>>,
  publishings: EventPublisherSchema,
  onServe: (server: Bun.Server<undefined>) => MaybePromise<void>,
}
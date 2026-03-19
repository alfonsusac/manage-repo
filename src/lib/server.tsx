import { type MaybePromise } from "bun"
import { RPCFetchHandlers, ServerEventPublisher, type EventMap } from "./ws-core"
import { resolve } from "path"



export async function appServer<
  M extends Record<string, (...args: any) => MaybePromise<any>>,
  E extends EventMap,
>(config: {
  port: number,
  host: string,
  indexHtml: Bun.HTMLBundle,
  publisher: ServerEventPublisher,
  onServe?: (server: Bun.Server<undefined>) => void,
  onWsOpen?: (ws: {
    send: (name: string, payload?: any) => void,
    instance: Bun.ServerWebSocket<undefined>
  }) => void,
  onExit?: () => void,
  methods?: M,
  events?: E,
  logger?: (...args: any[]) => void,
}) {
  // Prerequisites
  const rpc = RPCFetchHandlers({ methods: { ...config.methods } })

  const log = (...args: any[]) => config.logger?.(...args)

  // Start the server
  log("Starting server...")

  const server = Bun.serve({
    hostname: config.host,
    port: config.port,
    development: {
      console: true,
    },
    async fetch(req) {
      log(`Received request for ${ req.url } ${ req.method }`)
      return new Response("Not Found", { status: 404 })
    },
    routes: {
      "/ws": upgradeWsRoute,
      ...rpc.routeMap,
      "/*": process.env.NODE_ENV === "production" ?
        // refactor later
        async (req) => {
          try {
            const reqpath = req.url.replace(server.url.toString(), '')
            const filepath = resolve(import.meta.dir, req.url.replace(server.url.toString(), '') as string)
            if (reqpath === "")
              return new Response(Bun.file(resolve(import.meta.dir, 'index.html')))
            const staticFile = Bun.file(filepath)
            if (!await staticFile.exists())
              return new Response("Not Found", { status: 404 })
            return new Response(Bun.file(resolve(import.meta.dir, filepath)))
          } catch (error) {
            console.error("Error serving static file:", error)
            return new Response("Not Found", { status: 404 })
          }
        }
        : config.indexHtml
    },
    websocket: {
      open(ws) {
        log("Client connected. Count:", server.pendingWebSockets)
        config.publisher.subscribe(ws)
        config.onWsOpen?.({
          send: (name, payload) => {
            ws.send(JSON.stringify({ event: name, data: payload }))
          },
          instance: ws,
        })
      },
      close(ws) {
        log("Client disconnected. Count:", server.pendingWebSockets - 1)
        config.publisher.unsubscribe(ws)
      },
      message(ws, message) { },
    }
  })

  config.onServe?.(server)

  // Logging
  const routeCount = 2 + Object.keys(rpc.routeMap).length
  const methodCount = Object.keys(config.methods ?? {}).length
  log(`Server running at [${ server.url }]`)
  // log(`Routes  (${ routeCount }) = /, /ws, ${ Object.keys(rpc.routeMap).join(", ") }`)
  // log(`Methods (${ methodCount }) = ${ Object.keys(config.methods ?? {}).map(m => `${ m }`).join(", ") }`)

  onProcessExit(() => {
    log("Shutting down server...")
    config.onExit?.()
    server.stop()
  })

  return {
    server,
    _$serverEvents: {} as { [ K in keyof E ]: E[ K ] },
    _$rpcMethods: {} as M,
  }
}


export type AppServerOnWsOpen = NonNullable<Parameters<typeof appServer>[ 0 ]>[ "onWsOpen" ]





// async function renderRoot({
//   routeName = '/index.html',
//   title = "Fullstack Bun App",
//   payload = {},
// }: {
//   routeName: string,
//   title: string,
//   payload?: any,
// }) {
//   // const htmlpath = path.join(indexPath + routeName)

//   // Generate the HTML file with the React app rendered on the server
//   await Bun.write(indexPath, "<!-- This file is generated from Server.tsx -->\n" + renderToString(
//     <html>
//       <head>
//         <meta charSet="utf-8" />
//         <meta name="viewport" content="width=device-width, initial-scale=1" />
//         <title>{title}</title>
//         <style>
//           @layer theme, base, components, utilities;
//         </style>
//         <link rel="stylesheet" href="../app/styles.css" />
//       </head>
//       <body>
//         <div id="root"></div>
//         <div id="payload" data-payload={JSON.stringify(payload)}></div>
//         <script type="module" src="../app/Root.tsx"></script>
//       </body>
//     </html>
//   ))
// }

function upgradeWsRoute(req: Bun.BunRequest<"/ws">, server: Bun.Server<undefined>) {
  if (server.upgrade(req)) return undefined // upgrade() will handle the response.
  else return new Response("WebSocket upgrade failed", { status: 400 })
}


export function onProcessExit(callback: () => void) {
  process.on("exit", callback)
  process.on("SIGINT", () => {
    console.log("\nExiting...")
    callback()
    process.exit(0)
  })
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err)
    callback()
    process.exit(1)
  })
}




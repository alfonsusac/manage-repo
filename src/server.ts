import { ServerEventPublisher } from "./lib/ws-core"
import { appServer, onProcessExit } from "./lib/server"
import { PackageJson } from "./features/package-json"
import { UserSettings } from "./features/user-settings"
import { Pinger } from "./features/pinger"
import { DataCache } from "./lib/lib-cache"
import index from "./index.html"


export function log(...args: any[]) {
  console.log(`\x1b[32mserver\x1b[0m`, ...args)
}

export async function startManager(props: {
  host: string,
  port: number,
}) {
  // Host current cwd
  const cwd = process.cwd()
  console.log("CWD:", cwd)
  console.log(`   - Starting Manager on ${ props.host }:${ props.port }...`)

  const publisher = ServerEventPublisher({
    channel: "global",
    // onPublish: (payload) => log("Publishing global event:", [ payload.evName ])
  })
  const dataCache = await DataCache({
    path: `${ import.meta.dir }/.data/cache.json`,
    expiry: "5m",
  })

  const packageJson = await PackageJson(publisher.publish, dataCache, './package.json')
  const userSettings = await UserSettings(publisher.publish, `${ import.meta.dir }/.data/settings.json`)
  const pinger = Pinger(publisher.publish)

  const app = await appServer({
    logger: log,
    port: props.port,
    host: props.host,
    indexHtml: index,
    publisher,
    methods: {
      "getTime": () => new Date().toISOString(),
      "getRandomNumber": (prefix: string, suffix: number) => prefix + Math.random() + suffix,
      ...packageJson.methods,
      ...userSettings.methods,
      'info': () => ({
        port: props.port,
        url: app.server.url,
      })
    },
    events: {
      ...packageJson.events,
      ...userSettings.events,
      ...pinger.events
    },
    onServe: (server) => {
      publisher.setServer(server)
    },
    onWsOpen: (ws) => {
      packageJson.onWsOpen?.(ws)
      userSettings.onWsOpen?.(ws)
    },
    onExit: () => {
      packageJson.cleanup()
      userSettings.cleanup()
      pinger.cleanup()
    },
  })
  return app
}

export type ManagerServer = Awaited<ReturnType<typeof startManager>>
export type ManagerServerEvents = ManagerServer[ '_$serverEvents' ]
export type ManagerServerMethods = ManagerServer[ '_$rpcMethods' ]
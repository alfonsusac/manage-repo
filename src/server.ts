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
  port: string,
}) {
  // Host current cwd
  const cwd = process.cwd()
  console.log("CWD:", cwd)
  console.log(`   - Starting Manager on ${ props.host }:${ props.port }...`)

  const publisher = ServerEventPublisher("global",
    // (payload) => { log("Publishing global event:", [ payload.evName ]) }
  )
  const dataCache = DataCache('./.data/cache.json', { expiry: "5m" })
  await dataCache.initialize()
  const packageJson = await PackageJson(publisher.publish, dataCache, './package.json')
  const userSettings = await UserSettings(publisher.publish, './.data/settings.json')
  const pinger = Pinger(publisher.publish)

  const server = await appServer({
    publisher,
    methods: {
      "getTime": () => new Date().toISOString(),
      "getRandomNumber": (prefix: string, suffix: number) => prefix + Math.random() + suffix,
      ...packageJson.methods,
      ...userSettings.methods
    },
    events: {
      ...packageJson.events,
      ...userSettings.events,
      ...pinger.events
    },
    logger: log,
    indexHtml: index
  })

  publisher.initialize(server.server)
  onProcessExit(() => {
    server.server.stop()
    packageJson.cleanup()
    userSettings.cleanup()
    pinger.cleanup()
  })

  return server

}

export type ManagerServer = Awaited<ReturnType<typeof startManager>>
export type ManagerServerEvents = ManagerServer[ '_$serverEvents' ]
export type ManagerServerMethods = ManagerServer[ '_$rpcMethods' ]
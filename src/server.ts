import { ServerEventPublisher } from "./lib/ws-core"
import { appServer } from "./lib/server"
import { PackageJson } from "./features/package-json"
import { UserSettings } from "./features/user-settings"
import { Pinger } from "./features/pinger"
import { DataCache } from "./lib/lib-cache"
import index from "./index.html"
import { ClientRunner } from "./features/runner"


export function log(...args: any[]) {
  // if (process.env.NODE_ENV === "production") return
  console.log(`\x1b[32mserver\x1b[0m`, ...args)
}

export async function startManager(props: {
  host: string,
  port: number,
}) {
  // Host current cwd
  console.log(`   - Starting Manager on ${ props.host }:${ props.port }...`)

  const publisher = ServerEventPublisher({
    channel: "global",
    // onPublish: (payload) => log("Publishing global event:", [ payload.evName ])
  })
  const dataCache = await DataCache({
    expiry: "5m",
    path: `${ import.meta.dir }/.data/cache.json`,
  })
  const clientRunner = await ClientRunner({
    publisherFn: publisher.publish,
  })
  const userSettings = await UserSettings({
    path: `${ import.meta.dir }/.data/settings.json`,
    publisherFn: publisher.publish,
  })
  const packageJson = await PackageJson({
    dataCache,
    path: './package.json',
    publisherFn: publisher.publish,
    commandRunner: clientRunner.runCommand,
  })
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
      ...clientRunner.methods,
      ...packageJson.methods,
      ...userSettings.methods,
      'info': () => ({
        port: props.port,
        url: app.server.url,
      })
    },
    events: {
      ...clientRunner.events,
      ...packageJson.events,
      ...userSettings.events,
      ...pinger.events,
    },
    onServe: (server) => {
      publisher.setServer(server)
    },
    onWsOpen: (ws) => {
      packageJson.onWsOpen?.(ws)
      userSettings.onWsOpen?.(ws)
      clientRunner.onWsConnect?.(ws)
    },
    onExit: () => {
      clientRunner.cleanup()
      packageJson.cleanup()
      userSettings.cleanup()
      pinger.cleanup()
    },
  })

  // Host current cwd
  console.log(`   - Started`)

  return app
}

export type ManagerServer = Awaited<ReturnType<typeof startManager>>
export type ManagerServerEvents = ManagerServer[ '_$serverEvents' ]
export type ManagerServerMethods = ManagerServer[ '_$rpcMethods' ]
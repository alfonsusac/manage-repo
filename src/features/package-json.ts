import { jsonfetch } from "../lib/lib-fetch"
import type { DataCacheType } from "../lib/lib-cache"
import { JSONFileController } from "../lib/file-controller"
import { EventEmitter, type EventPublisherFn, RPCMethods } from "../lib/ws-core"
import type { AppServerOnWsOpen } from "../lib/server"

export type PackageJson = {
  name: string,
  version: string,
  description?: string,
  keywords?: string[],
  homepage?: string,
  bugs?: {
    url?: string,
    email?: string,
  } | string,
  dependencies?: Record<string, string>,
  devDependencies?: Record<string, string>,
  peerDependencies?: Record<string, string>,
  optionalDependencies?: Record<string, string>,
  bundleDependencies?: string[] | boolean,
  license?: string,
  author?: string | {
    name: string,
    email?: string,
    url?: string,
  },
  contributors?: PackageJson[ 'author' ][],
  maintainers?: PackageJson[ 'author' ][],
  funding?: string | {
    type?: string,
    url: string,
  } | ({
    type?: string,
    url: string,
  } | string)[],
  private?: boolean,
  repository?: string | {
    type: string,
    url: string,
    directory?: string,
  },
  scripts?: Record<string, string>,
}



export async function PackageJson(config: {
  publisherFn: EventPublisherFn,
  dataCache: DataCacheType,
  path: `./${ string }`,
}) {
  const { emitter, events } = EventEmitter<{
    'package-json-updated': PackageJson
  }>()

  const file = JSONFileController<PackageJson>(config.path)
  await file.initialize()
  file.subscribe(content => emitter(config.publisherFn).emit("package-json-updated", content))

  const methods = RPCMethods({
    "getPackageJSON": async () => { return file.get() },
    "updatePackageJSON": async (newData: PackageJson) => { await file.set(newData) },
    "getValidLicenses": getValidLicenses(config.dataCache),
  })

  const onWsOpen: AppServerOnWsOpen = (ws) => {
    emitter(ws.send).emit("package-json-updated", file.get())
  }

  return {
    methods: methods,
    events,
    cleanup() { file.cleanup() },
    onWsOpen
  }
}





function getValidLicenses(dataCache: DataCacheType) {
  return async () => {
    return dataCache.cache("spdx_licenses", async () => {
      const res = await jsonfetch<{
        licenses: { licenseId: string, isOsiApproved: boolean, name: string }[]
      }>("https://raw.githubusercontent.com/spdx/license-list-data/refs/heads/main/json/licenses.json")
      if (res.status === "fetch error") {
        console.log("error fetching licenses:", res.errorMessage)
        return { status: "fetch error" as const }
      }
      if (res.status === "parse error") {
        console.log("error parsing licenses json:", res.errorCode, res.errorMessage, res.readonlyRes)
        return { status: "parse error" as const }
      }
      return {
        status: "ok" as const, licenses: res.json.licenses.map(l => ({ id: l.licenseId, name: l.name, osiApproved: l.isOsiApproved }))
      }
    })
  }
}


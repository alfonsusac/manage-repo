import type { MaybePromise } from "bun"
import { JSONFileController } from "./file-controller"
import { durationToMs, type Duration } from "./util-duration"
import { getErrorMessage } from "./util-get-error-message"

export type DataCacheType = Awaited<ReturnType<typeof DataCache>>

export async function DataCache(opts: { expiry: Duration, path: string }) {

  const file = JSONFileController<Record<string, { timestamp: number, data: any }>>(opts.path, { onNotExist: "create", watch: false })
  await file.initialize()

  async function get<T>(key: string) {
    const cache = file.get()
    if (key in cache)
      return { data: cache[ key ].data as T, state: Date.now() - cache[ key ].timestamp < durationToMs(opts.expiry) ? "FRESH" as const : "EXPIRED" as const }
    return { data: null, state: "MISS" as const }
  }
  async function set<T>(key: string, data: T) {
    const cache = file.get()
    cache[ key ] = { timestamp: Date.now(), data }
    await file.set(cache)
  }

  async function cache<T>(key: string, fn: () => MaybePromise<T>) {
    const cached = await get<T>(key)
    if (cached.state === "FRESH")
      return cached.data
    try {
      const data = await fn()
      await set(key, data)
      return data
    } catch (error) {
      console.log(`Error in cache function for key ${ key }:`, getErrorMessage(error))
      if (cached.state === "EXPIRED") {
        console.log(`Returning expired cache for key ${ key } due to error.`)
        return cached.data
      }
      throw error
    }
  }

  return { get, set, cache }

}
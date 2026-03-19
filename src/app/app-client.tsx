import { createAppClient, type AppClient } from "../lib/server-client"
import type { ManagerServerEvents, ManagerServerMethods } from "../server"
import { getErrorMessage } from "../lib/util-get-error-message"
import { useQuery } from "../lib/react-store"


export type ManagerAppClient = AppClient<ManagerServerEvents>

export function useAppClient() {
  const [ appClient ] = useQuery("appClient", async (cleanup) => {
    const res = await call("info")
    const client = createAppClient<ManagerServerEvents>(`ws://${ new URL(res.url).host }/ws`)
    cleanup(() => client.cleanup())
    return client
  })
  return [ appClient ] as const
}

export function useWsReady() {
  const [ appClient ] = useAppClient()
  const [ ready, setReady ] = useQuery("wsReady_" + !!appClient,
    (clean) => {
      if (!appClient) return false
      clean(
        appClient.wsevent.subscribe((readyState) => {
          setReady(readyState === WebSocket.OPEN)
        })
      )
      return appClient?.instance.readyState === WebSocket.OPEN
    }
  )
  return [ ready ]
}

//------------
// RPC call helper

export async function call<T extends keyof ManagerServerMethods>(name: T, ...args: Parameters<ManagerServerMethods[ T ]>) {
  try {
    const res = await fetch(`/rpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, args })
    })
    const json = await res.json()
    return json.result as ManagerServerMethods[ T ] extends (...args: any) => infer R ? Awaited<R> : never
  } catch (error) {
    console.error("Error calling server method", name, getErrorMessage(error))
    throw error
  }
}

//------------
// Routing

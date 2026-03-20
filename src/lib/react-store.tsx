import { createContext, use, useEffect, useState, useSyncExternalStore } from "react"
import { Listener } from "./util-listener"
import { nanoid } from "nanoid"
import type { MaybePromise } from "bun"
import { getErrorMessage } from "./util-get-error-message"

export type Store<T> = ReturnType<typeof newStore<T>>
type Initializer<T> = () => T

export function newStore<T>(initialValue: Initializer<T>) {
  const id = nanoid(3)
  function ECLND(ctx: string) { throw new Error(`Store already cleaned up. Can't operate on store if it is already cleaned up. [${ ctx }]`) }
  const ref = {
    curr: initialValue(),
    listeners: new Listener<T>,
    cleaned: false,
  }
  function get() {
    if (ref.cleaned) ECLND('get')
    return ref.curr
  }
  function update(newdata: T) {
    if (ref.cleaned) ECLND('upd')
    ref.listeners.emit(ref.curr = newdata)
  }
  function subscribe(listener: (data: T) => void) {
    if (ref.cleaned) ECLND('sub')
    return ref.listeners.subscribe(listener)
  }
  function cleanup() {
    if (ref.cleaned) ECLND('cln')
    ref.listeners.clear()
    ref.cleaned = true
  }
  function length() {
    return ref.listeners.length()
  }
  function cleaned() {
    return ref.cleaned
  }
  return { update, get, subscribe, cleanup, id, length, cleaned }
}








type QueryClient = ReturnType<typeof newQueryClient>
type StoreEntry<T> = {
  store: Store<T>,
  cleanups: (() => void)[],
}

export function newQueryClient() {
  const storeMap = newStore<Record<string, StoreEntry<any>>>(() => ({}))
  function getStore<T>(key: string) {
    const entry = storeMap.get()[ key ]
    if (!entry) return undefined
    return entry.store as Store<T>
  }
  function registerStore<T>(
    key: string,
    create: (
      clean: (c: () => void | undefined) => void,
      update: (newData: T) => void
    ) => MaybePromise<T>,
  ) {
    const storeMapData = storeMap.get()
    if (storeMapData[ key ])
      return storeMapData[ key ].store as Store<T>
    const cleanups: (() => void)[] = []
    const clean = (c: () => void) => { cleanups.push(c) }
    const update = (newData: T) => {
      const store = storeMapData[ key ]?.store
      if (!store) throw new Error(`Store with key ${ key } not found. Can't update non-existing store.`)
      store.update(newData)
    }
    const store = newStore(() => {
      const res = create(clean, update)
      if (res instanceof Promise) {
        res.then(data => {
          if (storeMap.cleaned()) {
            cleanups.forEach(cleanup => cleanup?.())
            return
          }
          store.update(data)
        })
        return undefined as unknown as T
      } else {
        return res
      }
    })
    storeMapData[ key ] = { store, cleanups }
    storeMap.update(storeMapData)
    return storeMapData[ key ].store as Store<T>
  }
  function cleanup() {
    const map = storeMap.get()
    Object.entries(map).forEach(([ key, entry ]) => {
      entry.cleanups.forEach(cleanup => cleanup?.())
      entry.store.cleanup()
      delete map[ key ]
    })
    storeMap.cleanup()
  }
  return {
    storeMap, getStore, registerStore, cleanup
  }
}


const QueryClientContext = createContext<QueryClient>(null as any)

export function useQueryClientStore() {
  const [ client, setClient ] = useState<QueryClient>()
  useEffect(() => {
    const qc = newQueryClient()
    setClient(qc)
    return () => qc.cleanup()
  }, [])
  return client
}

export function QueryClientProvider(props: {
  children: React.ReactNode,
  qc: QueryClient | undefined,
}) {
  if (!props.qc) return null
  return <QueryClientContext value={props.qc}>
    {props.children}
  </QueryClientContext>
}




export function useQueryClient() {
  const client = use(QueryClientContext)
  if (!client) throw new Error("QueryClientContext not found")
  return client
}

// According to ChatGPT:
// - useQuery is not the right name for this hook, as it does more than just querying. 
// A more appropriate name might be useResource or useStore, as it allows both reading
// and writing to a store, as well as managing its lifecycle.
// - "given a key, construct or reuse a long-lived, stateful unit with its own 
// lifecycle and expose it to React" 

export function useQuery<T, T2 = T>(
  key: string,
  create: (
    clean: (c: () => void | undefined) => void,
    // update: (newData: T) => void
  ) => T,
  selector: ((data: T) => T2) = ((data: T) => data as unknown as T2),
  required?: boolean, // will throw error if true and data is not available yet
) {
  const client = useQueryClient()
  const data = useSyncExternalStore(
    (l) => {
      const store = client.registerStore<T>(key, create)
      return store.subscribe(l)
    },
    () => {
      // console.log("useQuery getter key", key)
      const store = client.registerStore<T>(key, create)
      return selector(store.get())
    }
  )
  if (required && data === undefined) {
    throw new Error(`Data for store ${ key } is required but not available yet.`)
  }
  function update(newData: Updater<Awaited<T>>) {
    // console.log("WRITE using key:", key)
    if (client.storeMap.cleaned()) return
    const store = client.getStore<T>(key)
    // console.log("WRITE GET store for key:", key, !!store)
    if (!store) throw new Error(`Store with key ${ key } not found. Can't update non-existing store.`)
    const next =
      typeof newData === "function"
        ? (newData as (prev: T) => T)(store.get())
        : newData
    store.update(next)
  }

  const store = client.getStore<T>(key)

  return [ data, update, store ] as [
    T2 extends Promise<any> ? Awaited<T2 | undefined> : T2,
    (newData: Updater<Awaited<T>>) => void,
    store: Store<T>
  ]
}

export type Updater<T> = T | ((prevData: T) => T)
export function resolveUpdater<T>(updater: Updater<T>, prevData: T): T {
  return typeof updater === "function"
    ? (updater as (prev: T) => T)(prevData)
    : updater
}

export type Selector<T, T2> = (data: T) => T2
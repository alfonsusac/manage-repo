import { EventEmitter, RPCMethods, type EventPublisherFn } from "../lib/ws-core"
import { JSONFileController } from "../lib/file-controller"
import type { AppServerOnWsOpen } from "../lib/server"

export type UserSettings = {
  checkProjectNameOnNPM: boolean,
  route: string,
  terminalWordWrap?: boolean,
}

export async function UserSettings(config: {
  publisherFn: EventPublisherFn,
  path: string
}) {
  type UserSettingsEvents = {
    'user-settings-updated': UserSettings
  }
  const { emitter, events } = EventEmitter<UserSettingsEvents>()

  const file = JSONFileController<UserSettings>(config.path, {
    onNotExist: async (file) => {
      const defaultSettings: UserSettings = {
        checkProjectNameOnNPM: false,
        route: "/",
        terminalWordWrap: false,
      }
      await file.write(JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }
  })
  await file.initialize()
  file.subscribe(content => emitter(config.publisherFn).emit("user-settings-updated", content))

  const methods = RPCMethods({
    "getUserSettings": async () => { return file.get() },
    "updateUserSettings": async (newData: Partial<UserSettings>) => {
      const currentData = file.get()
      const updatedData = { ...currentData, ...newData }
      await file.set(updatedData)
    }
  })

  const onWsOpen: AppServerOnWsOpen = (ws) => {
    emitter(ws.send).emit('user-settings-updated', file.get())
  }

  return {
    methods: methods,
    events,
    cleanup() { file.cleanup() },
    onWsOpen
  }
}
import { EventEmitter, RPCMethods, type EventPublisherFn } from "../lib/ws-core"
import { JSONFileController } from "../lib/file-controller"
import type { AppServerOnWsOpen } from "../lib/server"

export type UserSettings = {
  checkProjectNameOnNPM: boolean,
  route: string
}

export async function UserSettings(
  publisherFn: EventPublisherFn,
  path: string
) {
  type UserSettingsEvents = {
    'user-settings-updated': UserSettings
  }
  const { emitter, events } = EventEmitter<UserSettingsEvents>()

  const file = JSONFileController<UserSettings>(path, {
    onNotExist: async (file) => {
      const defaultSettings: UserSettings = {
        checkProjectNameOnNPM: false,
        route: "/"
      }
      await file.write(JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }
  })
  await file.initialize()
  file.subscribe(content => emitter(publisherFn).publish("user-settings-updated", content))

  const methods = RPCMethods({
    "getUserSettings": async () => { return file.get() },
    "updateUserSettings": async (newData: Partial<UserSettings>) => {
      console.log("Updating user settings with:", newData)
      const currentData = file.get()
      const updatedData = { ...currentData, ...newData }
      await file.set(updatedData)
    }
  })

  const onWsOpen: AppServerOnWsOpen = (ws) => {
    emitter(ws.send).publish('user-settings-updated', file.get())
  }

  return {
    methods: methods,
    events,
    cleanup() { file.cleanup() },
    onWsOpen
  }
}
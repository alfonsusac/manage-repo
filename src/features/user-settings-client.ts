import { call, useAppClient } from "../app/app-client"
import type { UserSettings } from "./user-settings"
import { useQuery } from "../lib/react-store"
import { useEffect } from "react"


export function useUserSettings(): [ UserSettings, (payload: Partial<UserSettings>) => void ]
export function useUserSettings(required: false): [ UserSettings | undefined, (payload: Partial<UserSettings>) => void ]
export function useUserSettings(required: boolean = true) {
  const [ client ] = useAppClient()
  const [ settings, updateSettingStore ] = useQuery(
    "userSettings" + !!client, async (clean) => {
      if (!client) return undefined
      clean(client.subscribe("user-settings-updated", data => updateSettingStore(data)))
      return await call("getUserSettings")
    })

  function update(payload: Partial<UserSettings>) {
    if (!settings) return console.log("Update failed: settings not loaded yet")
    call("updateUserSettings", payload)
  }
  if (required && !settings)
    throw new Error("user-settings is required but not available yet.")
  return [ settings, update ] as const
}

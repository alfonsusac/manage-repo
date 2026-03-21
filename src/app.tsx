import { newQueryClient, QueryClientProvider, useQuery } from "./lib/react-store"
import { usePackageJson } from "./features/package-json-client"
import { useUserSettings } from "./features/user-settings-client"
import { ProjectSettings } from "./app/pages/ProjectSettings"
import { RoutePage, useRouter } from "./app/app-routes"
import { ProjectScripts } from "./app/pages/ProjectScripts"
import { DependencyPage } from "./app/pages/Dependency"
import { useAppClient, useWsReady } from "./app/app-client"
import { AddDependencyPage } from "./app/pages/AddDependency"
import { Home } from "./app/pages/Home"
import { ConsoleAppWindow } from "./app/pages/Console"
import { ManagerChangelogPage } from "./app/pages/Changelog"

const qc = newQueryClient()
import.meta.hot.dispose(() => qc.cleanup())

export function AppRoot() {
  return (
    <div className="min-w-screen min-h-screen">
      <QueryClientProvider qc={qc}>
        <Init><App /></Init>
      </QueryClientProvider>
    </div>
  )
}

function Init(props: { children: React.ReactNode }) {
  const [ appClient ] = useAppClient()
  const [ packageJson ] = usePackageJson(false)
  const [ userSettings ] = useUserSettings(false)
  const [ wsReady ] = useWsReady()
  if (appClient === undefined || packageJson === undefined || userSettings === undefined || !wsReady) {
    return <div className="grid place-items-center h-screen w-screen ">
      <div className="grid w-50 starting:opacity-0 transition-all">
        <div className="animate-pulse text-fg-3">Loading...</div><br />
        <div className="animate-pulse text-fg-3">Client: {!!appClient ? "Ready" : "Not Ready"}</div>
        <div className="animate-pulse text-fg-3">PackageJSON: {!!packageJson ? "Ready" : "Not Ready"}</div>
        <div className="animate-pulse text-fg-3">UserSettings: {!!userSettings ? "Ready" : "Not Ready"}</div>
        <div className="animate-pulse text-fg-3">WebSocket: {wsReady ? "Ready" : "Not Ready"}</div>
      </div>
    </div>
  }
  return <>{props.children}</>
}

function App() {

  const router = useRouter()

  return (
    <div className="relative h-screen w-screen 
    overflow-x-hidden mx-auto overflow-y-visible
    ">
      <ConsoleAppWindow />

      <div className="w-full mx-auto">

        <RoutePage path="/">
          <Home />
        </RoutePage>

        <RoutePage path="/_changelog" className="max-w-xl mx-auto">
          <SubpageHeader title="Changelog" onBackClick={() => router.navigate("/", "backward")} />
          <ManagerChangelogPage />
        </RoutePage>

        <RoutePage path="/package-json" className="max-w-xl mx-auto">
          <SubpageHeader title="Project Settings" onBackClick={() => router.navigate("/", "backward")} />
          <ProjectSettings />
        </RoutePage>

        <RoutePage path="/scripts" className="max-w-xl mx-auto">
          <SubpageHeader title="Project Scripts" onBackClick={() => router.navigate("/", "backward")} />
          <ProjectScripts />
        </RoutePage>

        <RoutePage path="/dependencies" className="max-w-xl mx-auto">
          <SubpageHeader title="Project Dependencies" onBackClick={() => router.navigate("/", "backward")} />
          <DependencyPage />
        </RoutePage>

        <RoutePage path="/dependencies/add" className="max-w-xl mx-auto">
          <SubpageHeader title="Add Dependency (WIP)" onBackClick={() => router.navigate("/dependencies", "backward")} />
          <AddDependencyPage />
        </RoutePage>

      </div>

    </div>
  )
}


function SubpageHeader(props: {
  onBackClick: () => void,
  title: React.ReactNode
}) {
  return <header className="flex items-center gap-1 -mt-4 sticky top-0 bg-bg z-50 h-16">
    <div className="cursor-pointer text-fg-3 w-8 h-8 -ml-1 rounded-2xl hover:bg-fg-2/10 grid place-items-center"
      onClick={props.onBackClick}
    >{'←'}</div>
    <h2 className="font-medium text-xl text-fg">{props.title}</h2>
  </header>
}


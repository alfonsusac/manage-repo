import { newQueryClient, QueryClientProvider, useQuery } from "./lib/react-store"
import { usePackageJson } from "./features/package-json-client"
import { useUserSettings } from "./features/user-settings-client"
import { ProjectSettings } from "./app/pages/ProjectSettings"
import { RoutePage, routes, sidebarRoutes, useRouter } from "./app/app-routes"
import { ProjectScripts } from "./app/pages/ProjectScripts"
import { DependencyPage } from "./app/pages/Dependency"
import { useAppClient, useWsReady } from "./app/app-client"
import { AddDependencyPage } from "./app/pages/AddDependency"
import { Home } from "./app/pages/Home"
import { ConsoleAppWindow } from "./app/pages/Console"
import { ManagerChangelogPage } from "./app/pages/Changelog"
import { cn } from "lazy-cn"
import { SubpageHeader } from "./app/app-ui"

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
        <div className="animate-pulse text-fg-3">
          <div>Loading...</div><br />
          <div>Client: {!!appClient ? "Ready" : "Not Ready"}</div>
          <div>PackageJSON: {!!packageJson ? "Ready" : "Not Ready"}</div>
          <div>UserSettings: {!!userSettings ? "Ready" : "Not Ready"}</div>
          <div>WebSocket: {wsReady ? "Ready" : "Not Ready"}</div>
        </div>
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

        <div className="flex justify-center overflow-visible gap-8 px-8 max-w-5xl mx-auto">

          {router.current !== "/" &&
            <aside className="max-w-50 pt-10 hidden sm:block! flex-1 transition duration-300 starting:opacity-0 starting:-translate-x-8">
              <div className="bg-bg-2 sticky top-10 p-2 rounded-xl">
                {sidebarRoutes.map(item => {
                  return <SidebarMenuItem
                    icon={<div className="w-full h-full rounded-sm bg-fg-3/20" />}
                    title={item.title}
                    href={item.path}
                    key={item.path}
                    onClick={() => router.navigate(item.path, null)}>
                  </SidebarMenuItem>
                })}
              </div>
            </aside>
          }

          <div className="w-full flex-1">
            <RoutePage path="/_changelog" className="max-w-lg mx-auto">
              <SubpageHeader title="Changelog" onBackClick={() => router.navigate("/", "backward")} />
              <ManagerChangelogPage />
            </RoutePage>

            <RoutePage path="/package-json" className="max-w-lg mx-auto">
              <SubpageHeader title="Project Settings" onBackClick={() => router.navigate("/", "backward")} />
              <ProjectSettings />
            </RoutePage>

            <RoutePage path="/scripts" className="max-w-lg mx-auto">
              <SubpageHeader title="Project Scripts" onBackClick={() => router.navigate("/", "backward")} />
              <ProjectScripts />
            </RoutePage>

            <RoutePage path="/dependencies" className="max-w-lg mx-auto">
              <SubpageHeader title="Project Dependencies" onBackClick={() => router.navigate("/", "backward")} />
              <DependencyPage />
            </RoutePage>

            <RoutePage path="/dependencies/add" className="max-w-lg mx-auto">
              <SubpageHeader title="Add Dependency (WIP)" onBackClick={() => router.navigate("/dependencies", "backward")} />
              <AddDependencyPage />
            </RoutePage>
          </div>


        </div>
      </div>
    </div>
  )
}





function SidebarMenuItem(props: {
  title: React.ReactNode,
  description?: React.ReactNode,
  onClick?: () => void,
  href: string,
  icon: React.ReactNode,
}) {
  const router = useRouter()
  const isActive = router.pathname === props.href

  return <button
    onClick={props.onClick}
    className={cn(
      "flex items-center w-full p-2 px-3 hover:bg-bg-3 cursor-pointer active:hover:bg-bg-2 rounded-xl",
      "group",
      isActive && "bg-bg-3"
    )}>
    {/* <div className="w-5 h-5 text-fg-3 shrink-0 mr-3">
      {props.icon}
    </div> */}
    <div className="text-left">
      <div className={cn(
        "text-fg-3 text-sm ml-1 group-hover:text-fg",
        isActive && "text-fg-2"
      )}>{props.title}</div>
      {props.description && <div className="text-sm text-fg-4">{props.description}</div>}
    </div>
  </button>

}
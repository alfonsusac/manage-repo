import { usePackageJson } from "../../features/package-json-client"
import { call } from "../app-client"
import { useRouter } from "../app-routes"
import { MaterialSymbolsPlayArrowRounded } from "../app-ui"
import { useTerminals, useTerminalWindow } from "./Console"

export function Home() {

  const [ packageJson ] = usePackageJson(false)
  const router = useRouter()
  const terminal = useTerminals()
  const terminalWindow = useTerminalWindow()


  return (
    <>
      <header className="sticky top-0 -mt-4 -mx-4 p-6 pt-12! bg-bg z-50">
        <div className="font-semibold text-sm text-fg-3">Package Manager</div>
        <h1 className="font-mono text-2xl break-all">{packageJson?.name}</h1>
      </header>
      <div className="flex flex-col gap-6">
        <div className="-mx-1 bg-bg-2/50 rounded-xl overflow-hidden">
          <div className="p-4 flex flex-col gap-2">
            <h2 className="text-fg-4 text-sm font-medium">Scripts</h2>
            <div className="-mb-3">
              {packageJson?.scripts ? Object.keys(packageJson.scripts)
                .filter(script => script.startsWith("pre") || script.startsWith("post") ? false : true)
                .map(script => {
                  return <div
                    key={script}
                    className="button ghost font-mono -mx-3 rounded-lg px-3 py-2 flex items-center gap-2 text-fg hover:bg-bg-2"
                    onClick={() => {
                      call("runPackageScript", script, terminal.selected?.id)
                      terminalWindow.openTerminalWindow()
                    }}
                  >
                    <MaterialSymbolsPlayArrowRounded
                      className="text-fg-3 text-xl"
                    />
                    <div>Run {script}</div>
                  </div>
                }) : <span className="text-sm text-fg-3">No scripts defined.</span>}
            </div>
          </div>
        </div>

        <div className="-mx-1 bg-bg-2/50 rounded-xl overflow-hidden">
          <MenuItem
            title="package.json" description="Edit project settings."
            onClick={() => router.navigate("/package-json", "forward")}
          />
          <MenuItem
            title="Scripts" description="Edit project scripts."
            onClick={() => router.navigate("/scripts", "forward")}
          />
          <MenuItem
            title="Dependencies" description="Edit project dependencies."
            onClick={() => router.navigate("/dependencies", "forward")}
          />
        </div>
      </div>
    </>

  )
}


function MenuItem(props: {
  title: React.ReactNode,
  description?: React.ReactNode,
  onClick: () => void,
}) {
  return <button
    onClick={props.onClick}
    className="flex justify-between w-full p-3 px-4 pb-4 hover:bg-bg-2/50 cursor-pointer active:hover:bg-bg-2/75">
    <div className="flex flex-col gap-0 text-start">
      <div className="font-medium text-fg-2">{props.title}</div>
      <div className="text-xs text-fg-3">
        {props.description}
      </div>
    </div>
    <div className="text-fg-3">{'→'}</div>
  </button>
}
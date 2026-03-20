import { usePackageJson } from "../../features/package-json-client"
import { call } from "../app-client"
import { useRouter } from "../app-routes"
import { MaterialSymbolsPlayArrowRounded } from "../app-ui"
import { useTerminals, useTerminalWindow } from "./Console"

import packageJson from "../../../package.json"

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

        <MenuSection title="Scripts">
          <div className="-mb-2">
            {packageJson?.scripts ? Object.keys(packageJson.scripts)
              .filter(script => script.startsWith("pre") || script.startsWith("post") ? false : true)
              .map(script => {
                return <div
                  key={script}
                  className="button ghost font-mono -mx-4 rounded-lg px-2 py-2 flex items-center gap-2 text-fg hover:bg-bg-2"
                  onClick={() => {
                    call("runPackageScript", script, terminal.selected?.id)
                    terminalWindow.openTerminalWindow()
                  }}
                >
                  <MaterialSymbolsPlayArrowRounded
                    className="text-fg-4 text-xl"
                  />
                  <div>Run {script}</div>
                </div>
              }) : <span className="text-sm text-fg-3">No scripts defined.</span>}
          </div>
        </MenuSection>

        <MenuSection title="Links">

        </MenuSection>

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

        <footer className="flex flex-col gap-2 text-fg-4 text-sm font-mono pt-10">
          <div>
            Running on localhost:{window.location.port} - v{packageJson?.version}
          </div>
          <div>
            <InlineLink
              onClick={() => router.navigate("/_changelog", "forward")}
            >changelog</InlineLink>
            {' - '}
            <InlineLink href="https://github.com/alfonsusac/manage-repo">github</InlineLink>
            {' - '}
            <InlineLink href="https://www.npmjs.com/package/manage-repo">npm</InlineLink>
            {' - '}
            <InlineLink href="https://npmx.dev/package/manage-repo">npmx</InlineLink>
          </div>
        </footer>
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


function MenuSection(props: {
  title: React.ReactNode,
  children?: React.ReactNode,
}) {

  return (
    <div className="-mx-1 bg-bg-2/50 rounded-xl overflow-hidden">
      <div className="p-4 flex flex-col gap-2">
        <h2 className="text-fg-4 text-sm font-medium">{props.title}</h2>
        {props.children}
      </div>
    </div>
  )
}

function InlineLink(props: {
  href?: string,
  children: React.ReactNode
  onClick?: () => void
}) {
  return <a
    onClick={props.onClick}
    href={props.href}
    target="_blank"
    className="text-fg-4 hover:text-fg-3 hover:underline underline-offset-4"
  >
    {props.children}
  </a>
}
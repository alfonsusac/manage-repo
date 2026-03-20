import { usePackageJson } from "../../features/package-json-client"
import { call } from "../app-client"
import { useRouter } from "../app-routes"
import { LucideArrowUpRight, MaterialSymbolsPlayArrowRounded } from "../app-ui"
import { useTerminals, useTerminalWindow } from "./Console"

import packageJson from "../../../package.json"
import { cn } from "lazy-cn"

export function Home() {

  const router = useRouter()

  return (
    <>
      <header className="sticky top-0 -mt-4 -mx-4 p-6 pt-12! bg-bg z-50">
        <div className="font-semibold text-sm text-fg-3">Package Manager</div>
        <h1 className="font-mono text-2xl break-all">{packageJson?.name}</h1>
      </header>
      <div className="flex flex-col gap-6">

        <HomeScriptsSection />
        <HomeLinksSection />

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
  onClick?: () => void,
  href?: string
}) {
  return <button
    onClick={props.onClick}
    className="flex justify-between w-full p-3 px-4 pb-3 last:pb-4 first:pt-4 hover:bg-bg-2/50 cursor-pointer active:hover:bg-bg-2/75">
    <div className="flex flex-col gap-0 text-start">
      <div className="font-medium text-fg-2">{props.title}</div>
      {props.description &&
        <div className="text-xs text-fg-3">
          {props.description}
        </div>}
    </div>
    <div className="text-fg-3">{'→'}</div>
  </button>
}

function MenuItemSmall({ href, ...props }: React.ComponentProps<"div"> & React.ComponentProps<"a"> & {
  href?: string
}) {
  if (href) {
    return <a
      href={href}
      target="_blank"
      {...props}
      className={cn("button ghost font-mono rounded-lg px-3 py-2 flex items-center gap-2 text-fg hover:bg-bg-2", props.className)}
    >
      {props.children}
    </a>
  }

  return <div
    {...props}
    className={cn("button ghost font-mono rounded-lg px-3 py-2 flex items-center gap-2 text-fg hover:bg-bg-2", props.className)}
  >
    {props.children}
  </div>
}


function MenuSection(props: {
  title: React.ReactNode,
  children?: React.ReactNode,
}) {

  return (
    <div className="-mx-1 bg-bg-2/50 rounded-xl overflow-hidden">
      <div className="flex flex-col">
        <h2 className={cn("text-fg-4 text-sm font-medium p-4 pb-2! pl-5!")}>{props.title}</h2>
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


function HomeScriptsSection() {

  const terminal = useTerminals()
  const terminalWindow = useTerminalWindow()

  const scripts = packageJson?.scripts ? Object.keys(packageJson.scripts)
    .filter(script => script.startsWith("pre") || script.startsWith("post") ? false : true) : []

  if (scripts.length === 0) return null

  return (
    <MenuSection title="Scripts">
      <div className="pb-2 px-2">
        {scripts.map(script => {
          return <MenuItemSmall onClick={() => {
            call("runPackageScript", script, terminal.selected?.id)
            terminalWindow.openTerminalWindow()
          }}>
            <MaterialSymbolsPlayArrowRounded
              className="text-fg-4 text-xl -ml-1"
            />
            <div>Run {script}</div>
          </MenuItemSmall>
        })}
      </div>
    </MenuSection>
  )
}

function HomeLinksSection() {
  const [ packageJson ] = usePackageJson(false)

  const repoitory = packageJson?.repository && typeof packageJson.repository === "object" ? packageJson.repository.url : packageJson?.repository as string | undefined
  const homepage = packageJson?.homepage
  const bugs = packageJson?.bugs && typeof packageJson.bugs === "object" ? packageJson.bugs.url : packageJson?.bugs as string | undefined
  const hasLinks = repoitory || homepage || bugs

  if (!hasLinks) return null

  return (
    <MenuSection title="Links">
      <div className="px-2 pb-2">
        {repoitory &&
          <MenuItemSmall className="pl-3 text-fg-2" href={repoitory}>
            Repository <LucideArrowUpRight className="text-fg-4" />
          </MenuItemSmall>
        }
        {homepage &&
          <MenuItemSmall className="pl-3 text-fg-2" href={homepage}>
            Homepage <LucideArrowUpRight className="text-fg-4" />
          </MenuItemSmall>
        }
        {bugs &&
          <MenuItemSmall className="pl-3 text-fg-2" href={bugs}>
            Bugs <LucideArrowUpRight className="text-fg-4" />
          </MenuItemSmall>
        }
      </div>
    </MenuSection>
  )
}
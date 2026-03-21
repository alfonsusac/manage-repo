import { usePackageJson } from "../../features/package-json-client"
import { call, useAppClient } from "../app-client"
import { useRouter } from "../app-routes"
import { LucideArrowUpRight, MaterialSymbolsPlayArrowRounded } from "../app-ui"
import { useTerminals, useTerminalWindow } from "./Console"

import packageJson from "../../../package.json"
import { cn } from "lazy-cn"
import { useQuery } from "../../lib/react-store"
import Markdown from "react-markdown"

export function Home() {

  const router = useRouter()

  return (
    <div className="">
      <div className="w-full bg-bg z-50 sticky top-0">
        <header className="max-w-xs md:max-w-3xl w-full mx-auto  -mt-4 -mx-4 p-6 pt-12! ">

          <div className="font-semibold text-sm text-fg-3">Package Manager</div>
          <h1 className="font-mono text-2xl break-all">{packageJson?.name}</h1>
        </header>
      </div>
      <div className="flex justify-center gap-8">

        {/* Left Part */}
        <div className="flex flex-col gap-6 max-w-xs w-full">

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

        </div>

        <div className="hidden md:block! max-w-lg w-full rounded-xl px-4">
          <h2 className="font-mono text-sm text-fg-4">readme.md</h2>
          <div className="flex flex-col">
            <div className="font-mono text-fg-3
            [&>h1]:mt-6
            [&>h1]:text-xl
            [&>h1]:border-b
            [&>h1]:border-fg-4/50
            [&>h1]:pb-3
            [&>h2]:mt-6
            [&>h2]:text-lg
            [&>h3]:mt-6
            [&>h3]:text-base
            [&>p]:my-4
            [&>p]:text-sm
            [&>pre]:my-4
            [&>pre]:bg-bg-2/50
            [&>pre]:p-4
            [&>pre]:rounded-md
            [&>pre]:px-5
            [&>pre_code]:px-0
            [&>pre_code]:bg-none
            [&>ul]:my-4
            [&>ul]:list-disc
            [&>ul]:list-outside
            [&>ul]:pl-5
            [&_li]:my-2
            [&_li]:text-sm
            [&_code]:bg-bg-2/50
            [&_code]:px-1
          ">
              <PackageReadme />
            </div>
          </div>
        </div>
      </div>

      <footer className="max-w-xl w-full mx-auto flex flex-col items-center text-center gap-2 text-fg-4 text-sm font-mono pt-10">
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
      <div className="text-fg text-base">{props.title}</div>
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
          <MenuItemSmall className="pl-3 text-fg" href={repoitory}>
            Repository <LucideArrowUpRight className="text-fg-4" />
          </MenuItemSmall>
        }
        {homepage &&
          <MenuItemSmall className="pl-3 text-fg" href={homepage}>
            Homepage <LucideArrowUpRight className="text-fg-4" />
          </MenuItemSmall>
        }
        {bugs &&
          <MenuItemSmall className="pl-3 text-fg" href={bugs}>
            Bugs <LucideArrowUpRight className="text-fg-4" />
          </MenuItemSmall>
        }
      </div>
    </MenuSection>
  )
}




function PackageReadme() {
  const [ client ] = useAppClient()
  const [ readme, setReadme ] = useQuery("app-readme" + !!client, (clean) => {
    if (!client) return
    clean(client.subscribe("readme-md-updated", (data) => {
      setReadme(data)
    }))
    return "test" as string
  })

  console.log(readme)

  return <Markdown>
    {readme}
  </Markdown>
}
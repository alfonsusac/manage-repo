import { cn } from "lazy-cn"
import { LucideCheck, LucideChevronDown, LucideX, SvgSpinners180RingWithBg, Switch } from "../app-ui"
import { useState } from "react"
import { call, useAppClient } from "../app-client"
import { useQuery } from "../../lib/react-store"
import type { TerminalOutputChunk } from "../../features/runner"
import { useUserSettings } from "../../features/user-settings-client"
import { getErrorMessage } from "../../lib/util-get-error-message"
import { AnsiHtml } from "fancy-ansi/react"
import { useEffect, useRef } from "react"

export type TerminalTabClientStore = {
  id: string,
  name: string,
  status: "running" | "exited",
  exitCode?: number | null,
  messageChunks: TerminalOutputChunk[],
}[]

export function useTerminals() {
  const [ client ] = useAppClient()
  const [ terminals, updateTerminals, terminalsStore ] = useQuery<{
    selected: number | null,
    list: TerminalTabClientStore,
  }>("app-terminals-" + !!client, (clean) => {
    if (!client) return { selected: null, list: [] }
    client.subscribe("terminal-tab-data", data => {
      const prev = terminalsStore.get()
      prev.list = data
      prev.selected = (() => {
        if (prev.selected === null) return data[ 0 ] ? 0 : null // if no terminal is selected, select the first one if it exists
        if (data[ prev.selected ]) return prev.selected   // if the previously selected terminal still exists, keep it selected
        return data.length - 1  // otherwise, select the last terminal (the most recently opened one)
      })()
      updateTerminals({ ...prev })
    })
    return { selected: null, list: [] }
  })

  function selectTerminal(index: number) {
    updateTerminals(ts => ({ ...ts, selected: index }))
  }
  function closeTerminal(tabId: string) {
    call("runner:delete-tab", tabId)
  }

  const selected = terminals.selected !== null ? terminals.list.at(terminals.selected) : undefined
  const list = terminals.list
  const length = terminals.list.length

  return {
    selected,
    length,
    list,
    selectedIndex: terminals.selected,
    selectTerminal,
    closeTerminal,
  }
}

export function useTerminalWindow() {
  const [ terminalWindowOpened, updateTerminalWindowOpened ] = useQuery("app-terminal-window-opened", () => false)
  function openTerminalWindow() {
    updateTerminalWindowOpened(true)
  }
  return {
    terminalWindowOpened,
    openTerminalWindow,
    updateTerminalWindowOpened
  }
}



export function ConsoleAppWindow() {

  const {
    terminalWindowOpened: opened,
    updateTerminalWindowOpened: setOpened,
    openTerminalWindow,
  } = useTerminalWindow()
  const terminal = useTerminals()
  const [ settings ] = useUserSettings()


  const terminalRef = useRef<HTMLDivElement>(null)
  const isNearBottomRef = useRef(true)
  const [ newMsgPopup, setNewMsgPopup ] = useState(true)

  useEffect(() => {
    const onScroll = () => {
      const terminalEl = terminalRef.current
      if (!terminalEl) return
      isNearBottomRef.current = terminalEl.scrollHeight - terminalEl.scrollTop - terminalEl.clientHeight < 100
      if (isNearBottomRef.current ) {
        setNewMsgPopup(false)
      }
    }
    const terminalEl = terminalRef.current
    if (!terminalEl) return
    terminalEl.addEventListener("scroll", onScroll)
    return () => terminalEl.removeEventListener("scroll", onScroll)
  }, [ terminal.selectedIndex, opened ])

  useEffect(() => {
    const terminalEl = terminalRef.current
    if (!terminalEl || !opened) return
    // Scroll to bottom when new output is added, but only if we're already near the bottom (within 100px)
    // const isNearBottom = terminalEl.scrollHeight - terminalEl.scrollTop - terminalEl.clientHeight < 100
    const isNearBottom = isNearBottomRef.current
    if (isNearBottom) {
      setTimeout(() => {
        terminalEl.scrollTo({ top: terminalEl.scrollHeight, behavior: "smooth" })
      })
    } else {
      setNewMsgPopup(true)
    }
  }, [ terminal.selected?.messageChunks.length ])

  useEffect(() => {
    const terminalEl = terminalRef.current
    if (!terminalEl || !opened) return
    // Scroll to bottom when switching terminals, but only if we're already near the bottom (within 100px)
    terminalEl.scrollTo({ top: terminalEl.scrollHeight })
  }, [ terminal.selectedIndex, opened ])

  return <div className={cn("fixed bottom-0 left-0 right-0 z-50")}>
    <div className="console-surface h-full flex flex-col rounded-t-xl bg-bg-3">
      <div className="console-header text-sm text-fg-3 font-medium flex items-center gap-2 hover:text-fg-2 px-3 cursor-pointer"
        onClick={() => setOpened(!opened)}
      >
        <div className="grow flex items-center gap-2 py-4">
          <LucideChevronDown className={cn("transition-transform duration-300", !opened && "rotate-180")} />
          Output {terminal.length > 0 && <span className="text-fg-2">({terminal.length})</span>}
        </div>
        {opened && terminal.length > 0 &&
          <div className="shrink-0 button ghost"
            onClick={(e) => {
              e.stopPropagation()
              call("runner:delete-all-tabs")
            }}
          >
            Clear all
          </div>
        }
      </div>

      <div className={cn("grid grid-rows-[0fr] overflow-clip transition-[grid-template-rows] duration-300", opened && "grid-rows-[1fr]")}>
        <div className="min-h-0 min-w-0">

          {/* Content */}
          <div className="flex flex-col p-2 pt-0! mx-2 mb-2 rounded-md">
            <div className="console-tabs-container flex mb-1 gap-1 overflow-hidden min-w-0 flex-wrap">
              {terminal.list.map((t, index) => {
                return <div key={t.id} className={cn(
                  "console-tab h-8 rounded-md min-w-0 text-sm font-mono flex items-center bg-bg-3 select-none pr-3",
                  t.id === terminal.selected?.id ? "bg-bg-2" : "hover:bg-bg-2/50",
                  "transition-all duration-100",
                  "starting:opacity-0",
                  "starting:scale-75",
                  "basis-0 grow min-w-20",
                  "max-w-40"
                )}
                  onClick={(e) => {
                    e.stopPropagation()
                    terminal.selectTerminal(index)
                  }}
                >
                  <div
                    className="p-2 hover:text-fg-2 text-fg-3 cursor-pointer min-w-0 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      terminal.closeTerminal(t.id)
                    }}
                  >
                    <LucideX />
                  </div>
                  <div className="line-clamp-1 break-all">
                    {t.name}
                  </div>
                  {t.status === "exited" && t.exitCode !== 0 && <div className="shrink-0 size-2 bg-error rounded-2xl" />}
                  {t.status === "running" && <SvgSpinners180RingWithBg className="shrink-0 ml-2" />}
                </div>
              })}
            </div>

            {/* Console */}
            <div className="terminal-content bg-bg-2 grow rounded-lg font-mono text-sm leading-4 h-60 flex flex-col relative">
              <CopyButton text={
                terminal.selected?.messageChunks.map(c => c.chunk).join("") || ""
              } />

              <div className={cn(
                "absolute left-1/2 -translate-x-1/2 bottom-14 bg-bg-4 p-2 px-4 z-10 gap-2 rounded-full flex items-center hover:brightness-110 cursor-pointer",
                "transition-all transition-discrete duration-300",
                newMsgPopup ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
              )}
                onClick={() => {
                  const terminalEl = terminalRef.current
                  if (!terminalEl) return
                  terminalEl.scrollTo({ top: terminalEl.scrollHeight, behavior: "smooth" })
                  setNewMsgPopup(false)
                }}
              >
                <LucideChevronDown />
                New Message
              </div>

              <div
                ref={terminalRef}
                className={cn("min-h-0 grow overflow-auto p-4 relative",
                  !settings.terminalWordWrap ? "whitespace-pre" : "whitespace-pre-wrap text-shadow-[0_.07em_.1em_black]"
                )}>


                {terminal.selected?.messageChunks.map((message, index) => {
                  if (message.stream === "system") {
                    return <div className="text-fg-3 italic py-1" key={index}>
                      {'◆ '}{message.chunk.split("\n").map((ch, i) => {
                        return <span className="" key={i}>
                          {ch}
                        </span>
                      })}
                    </div>
                  }
                  return <span key={index}
                    className={cn(
                      message.stream === "stdout" ? "text-fg" : "text-error"
                    )}
                  >
                    <AnsiHtml text={message.chunk} />
                  </span>
                })}
                {terminal.list.length === 0 && <div className="text-fg-3">
                  No output yet. Run some commands to see the output here.
                </div>}
              </div>
              <div className="terminal-status-bar p-4 flex items-center">
                <div className="grow">
                  {terminal.selected?.status === "running" &&
                    <div className="text-fg-2">
                      Running...
                    </div>
                  }
                  {terminal.selected?.status === "exited" &&
                    (terminal.selected.exitCode === 0 ?
                      <div className="text-fg-3 italic">
                        Process exited. <LucideCheck className="inline" />
                      </div> :
                      <div className="text-error italic">
                        Process exited with code {terminal.selected.exitCode}.
                      </div>
                    )
                  }
                </div>
                <div>
                  <Switch
                    isOn={settings.terminalWordWrap || false}
                    label="Word Wrap"
                    onToggle={() => {
                      call("updateUserSettings", {
                        terminalWordWrap: !settings.terminalWordWrap,
                      })
                    }}
                  />
                </div>
                <div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
}



function CopyButton(props: {
  text: string,
}) {
  function copyToClipboard() {
    navigator.clipboard.writeText(props.text)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(err => {
        console.log(getErrorMessage(err))
      })
  }
  const [ copied, setCopied ] = useState(false)
  return <div className="text-xs p-1 absolute top-2 right-2 button z-10"
    onClick={copyToClipboard}
  >
    {copied ? "Copied!" : "Copy"}
  </div>
}
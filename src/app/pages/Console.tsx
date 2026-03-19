import { cn } from "lazy-cn"
import { LucideChevronDown, LucideX } from "../app-ui"
import { useState } from "react"

export function ConsoleAppWindow() {

  const [ opened, setOpened ] = useState(true)


  return <div className={cn("fixed bottom-0 left-0 right-0 z-50")}>
    <div className="console-surface h-full flex flex-col gap-2 rounded-t-xl bg-bg-3">
      <div className="console-header text-sm text-fg-3 font-medium flex items-center gap-2 hover:text-fg-2 px-3 pt-3 pb-2 cursor-pointer"
        onClick={() => setOpened(o => !o)}
      >
        <LucideChevronDown className={cn("transition-transform duration-300", !opened && "rotate-180")} />
        Console
      </div>

      <div className={cn("grid grid-rows-[0fr] overflow-clip transition-[grid-template-rows] duration-300", opened && "grid-rows-[1fr]")}>
        <div className="min-h-0">
          <div className="flex flex-col gap-1 p-3 pt-0!">
            <div className="console-tabs-container flex">
              <div className="console-tabs bg-bg-2 h-8 rounded-md max-w-40 grow text-sm font-mono flex items-center">
                <div className="p-2 hover:text-fg-2 text-fg-3 cursor-pointer">
                  <LucideX />
                </div>
                <div className="line-clamp-1">
                  bun i
                </div>
              </div>
            </div>
            <div className="bg-bg-2 grow rounded-lg p-4 font-mono text-sm overflow-auto leading-4 max-h-50">
              <div className="text-green-400"> npm install react</div>
              <div className="text-green-400"> npm install react-dom</div>
              <div className="text-yellow-400">Warning: react is already installed.</div>
              <div className="text-green-400"> npm install express</div>
              <div className="text-red-400">Error: Failed to install express.</div>
              <div className="text-green-400"> npm install react</div>
              <div className="text-green-400"> npm install react-dom</div>
              <div className="text-yellow-400">Warning: react is already installed.</div>
              <div className="text-green-400"> npm install express</div>
              <div className="text-red-400">Error: Failed to install express.</div>
              <div className="text-green-400"> npm install react</div>
              <div className="text-green-400"> npm install react-dom</div>
              <div className="text-yellow-400">Warning: react is already installed.</div>
              <div className="text-green-400"> npm install express</div>
              <div className="text-red-400">Error: Failed to install express.</div>
              <div className="text-green-400"> npm install react</div>
              <div className="text-green-400"> npm install react-dom</div>
              <div className="text-yellow-400">Warning: react is already installed.</div>
              <div className="text-green-400"> npm install express</div>
              <div className="text-red-400">Error: Failed to install express.</div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
}
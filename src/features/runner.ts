import { nanoid } from "nanoid"
import { EventEmitter, RPCMethods, type EventPublisherFn } from "../lib/ws-core"
import type { AppServerOnWsOpen } from "../lib/server"

type TerminalOutputChunkStream = "stdout" | "stderr" | "system"

export type TerminalOutputChunk = {
  chunk: string,
  stream: TerminalOutputChunkStream,
}

export async function ClientRunner(config: {
  publisherFn: EventPublisherFn,
}) {
  const { emitter, events } = EventEmitter<{ // BE -> FE
    "terminal-tab-data": TerminalTabStore
  }>()

  const {
    tabData,
    cleanup: cleanupRunner,
    deleteTab,
    deleteAllTabs,
    killProcess,
    runCommand,
  } = RunnerCollection({
    onSpawnError(error) {
      console.log("Error spawning process:", error)
    },
    onTabsChange(tabData) {
      emitter(config.publisherFn).emit("terminal-tab-data", tabData)
    },
  })



  const methods = RPCMethods({ // FE -> BE
    // "runner:run-command": async (command: string) => {
    //   await runCommand(command)
    // },
    "runner:delete-tab": async (terminalId: string) => {
      deleteTab(terminalId)
    },
    "runner:delete-all-tabs": async () => {
      deleteAllTabs()
    }
  })
  const onWsConnect: AppServerOnWsOpen = (ws) => {
    emitter(ws.send).emit("terminal-tab-data", tabData)
  }
  const cleanup = () => {
    cleanupRunner()
  }

  return {
    events,
    methods,
    runCommand,
    onWsConnect,
    cleanup,
  }

}


export type ClientRunnerCommandRunner = Awaited<ReturnType<typeof ClientRunner>>[ "runCommand" ]

//     // TODO: implement
//     // - open a new terminal
//     // - run the command in the terminal
//     // - emit the output of the command to the terminal-output event
//     // - when the command is finished, close the terminal and emit the close-terminal event


export type TerminalTabStore = {
  id: string,
  name: string,
  status: "running" | "exited",
  exitCode?: number | null,
  messageChunks: TerminalOutputChunk[]
  tid?: string, // internal use only, to link the terminal tab with the process id. not exposed to the client.
}[]


// Unoptimized version of the runner, that runs commands and keeps track of them in memory. 
// This is used for the manager server, and is not used in production.
// The client runner is used in production, and it communicates with the manager server to 
// run commands and get their output.

function RunnerCollection(config: {
  onTabsChange: (tabData: TerminalTabStore) => void,
  onSpawnError: (error: unknown) => void,
}) {
  const processes = new Map<string, Bun.Subprocess>()
  const tabData: TerminalTabStore = []

  function cleanup() {
    processes.forEach(p => p.kill())
    processes.clear()
    tabData.length = 0
  }

  function getTab(id: string) {
    return tabData.find(t => t.id === id)
  }

  function runCommand(command: string, reuseTabId: string | undefined) {
    // 0 resolve tab id
    const tab = (() => {
      if (reuseTabId) {
        const existingTab = getTab(reuseTabId)
        if (existingTab && existingTab.status === "exited") {
          existingTab.name = command
          existingTab.status = "running"
          existingTab.messageChunks.push({ chunk: `Running command: ${ command }\n`, stream: "system" as TerminalOutputChunkStream })
          return existingTab
        }
      }
      const newTab = {
        id: nanoid(), name: command, status: "running" as const,
        messageChunks: [ { chunk: `Running command: ${ command }\n`, stream: "system" as TerminalOutputChunkStream } ],
      }
      tabData.push(newTab)
      config.onTabsChange(tabData)
      return newTab
    })()
    const tabid = tab.id


    // 1 generate a unique id for the terminal
    const tid = nanoid()
    // 2 spawn the process
    let subprocess: Bun.Subprocess<"ignore", "pipe", "pipe">
    try {
      subprocess = Bun.spawn({
        cmd: command.split(' '),
        stdout: "pipe",
        stderr: "pipe",
        onExit(subprocess, exitCode, signalCode, error) {
          const tab = getTab(tabid)
          if (!tab) return
          tab.status = "exited"
          tab.exitCode = exitCode
          tab.messageChunks.push({ chunk: `Process exited with code ${ exitCode }, signal: ${ signalCode }, error: ${ error }\n`, stream: "system" })
          config.onTabsChange(tabData)
        },
      })
    } catch (error) {
      console.error("Error spawning process:", error)
      config.onSpawnError(error)
      return
    }
    // 5 store process and tab info in memory
    processes.set(tid, subprocess)


    // 6 read process output and update tab data
    readStream(subprocess.stdout, (chunk) => {
      tab.messageChunks.push({ chunk, stream: "stdout" })
      config.onTabsChange(tabData)
    })
    readStream(subprocess.stderr, (chunk) => {
      tab.messageChunks.push({ chunk, stream: "stderr" })
      config.onTabsChange(tabData)
    })
    // 7 return
    return {
      tid,
      tabid: tab.id,
    }
  }


  function killProcess(terminalId: string) {
    const process = processes.get(terminalId)
    if (process) {
      process.kill()
    }
  }

  function deleteTab(tabId: string) {
    const index = tabData.findIndex(t => t.id === tabId)
    if (index !== -1) {
      processes.get(tabData[ index ].tid!)?.kill()
      tabData.splice(index, 1)
      config.onTabsChange(tabData)
    }
  }

  function deleteAllTabs() {
    processes.forEach(p => p.kill())
    processes.clear()
    tabData.length = 0
    config.onTabsChange(tabData)
  }

  return {
    tabData,
    cleanup,
    runCommand,
    killProcess,
    deleteTab,
    deleteAllTabs
  }
}






async function readStream(
  stream: ReadableStream<Uint8Array>,
  onChunk: (chunk: string) => void,
) {
  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const output = new TextDecoder().decode(value)
    onChunk(output)
  }
}








// async function runCommand(command: string) {

//   const terminalId = crypto.randomUUID()
//   const id = terminalId


//   const eemitter = emitter(config.publisherFn)

//   // 1 - emit start terminal
//   eemitter.emit("terminal:create", {
//     terminalId,
//     terminalName: command,
//   })
//   eemitter.emit("terminal:output", {
//     terminalId,
//     chunk: `Running command: ${ command }\n`,
//     stream: "system",
//   })

//   // 2 - prepare process
//   let subprocess: Bun.Subprocess<"ignore", "pipe", "pipe">
//   try {
//     subprocess = Bun.spawn({
//       cmd: command.split(' '),
//       stdout: "pipe",
//       stderr: "pipe",
//       onExit(subprocess, exitCode, signalCode, error) {
//         // 5 - emit terminal exit
//         processes.delete(terminalId)
//         processData.find(p => p.id === terminalId)!.status = "exited"
//         console.log("Process exited with code", exitCode, "signal", signalCode, "error", error)
//         eemitter.emit("terminal:output", {
//           terminalId,
//           chunk: `Process exited with code ${ exitCode }${ signalCode ? `, signal ${ signalCode }` : "" }${ error ? `, error: ${ error.message }` : "" }\n`,
//           stream: "system",
//         })
//         eemitter.emit("terminal:exit", {
//           terminalId,
//           terminalExitCode: exitCode,
//         })
//       },
//     })
//   } catch (error) {
//     console.error("Error spawning process:", error)
//     eemitter.emit("terminal:exit", {
//       terminalId,
//       terminalExitCode: -1,
//     })
//     return
//   }

//   processes.set(terminalId, { process: subprocess })
//   processData.push({
//     id,
//     name: command,
//     status: "running",
//     messageChunks: [],
//   })


//   // 3 - reader
//   const readStream = async (
//     stream: ReadableStream<Uint8Array>,
//     streamType: "stdout" | "stderr",
//   ) => {
//     ReadStream.from(stream).on("data", (chunk) => {
//       console.log("Chunk received from", streamType, ":", String.fromCharCode(...chunk))
//     })
//     // const reader = stream.getReader()
//     // while (true) {
//     //   const { done, value } = await reader.read()
//     //   if (done) break
//     //   const output = new TextDecoder().decode(value)
//     //   // process.stdout.write(output)
//     //   eemitter.emit("terminal:output", {
//     //     terminalId,
//     //     chunk: output,
//     //     stream: streamType,
//     //   })
//     //   processData.find(p => p.id === terminalId)?.messageChunks.push({
//     //     chunk: output,
//     //     stream: streamType,
//     //   })
//     // }
//   }

//   // 4 - run in parallel
//   readStream(subprocess.stdout, "stdout")
//   readStream(subprocess.stderr, "stderr")

//   return terminalId
// }

// async function killCommand(terminalId: string) {
//   const processInfo = processes.get(terminalId)
//   if (!processInfo) {
//     console.warn("No process found for terminalId", terminalId)
//     return
//   }
//   processInfo.process.kill()
//   const processDataItem = processData.find(p => p.id === terminalId)
//   if (processDataItem) {
//     processDataItem.status = "exited"
//   }
// }
import { getErrorCode } from "./util-get-error-message"

export async function isPortExist(port: number, host: string): Promise<boolean> {
  try {
    const server = Bun.serve({
      port,
      hostname: host === "localhost" ? undefined : host,
      routes: {
        '/': () => new Response("OK")
      }
    })
    server.stop()
    return false
  } catch (error) {
    if (getErrorCode(error) === "EADDRINUSE") {
      return true
    } else {
      console.error("Error checking port:", error)
      return false
    }
  }
}

// export async function findAvailablePort(startPort: number, maxPort: number) {
//   for (let port = startPort; port <= maxPort; port++) {
//     const isAvailable = await checkPort(port)
//     if (isAvailable) {
//       return port
//     }
//   }
//   throw new Error(`No available ports found between ${ startPort } and ${ maxPort }`)
// }
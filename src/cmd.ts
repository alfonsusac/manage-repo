#!/usr/bin/env bun

import { program } from "commander"
import readline from "readline"
import { startManager } from "./server"


// Default configuration values
const DEFAULT_PORT = 5474
const DEFAULT_HOST = "localhost"

// Read version and description from package.json
const packageJson = await import("../package.json")
const appName = packageJson.name
const appVersion = packageJson.version
const appDescription = packageJson.description

program
  .name(appName)
  .version(appVersion)
  .description(appDescription)
  .option("-p, --port <number>", "Specify port number", (value) => parseInt(value, 10))
  .option("-b, --bind <string>", "Specify address to bind", "localhost")
  .option("--showdir", "Show directory path of where the command is run")
  .option("--no-analytics", "Disable analytics tracking")
  .parse(process.argv)

const options = program.opts()

// Analytics
const skipAnalytics = options.noAnalytics
if (!skipAnalytics) {
  fetch(`https://alfon.dev/api/public/analytics`, {
    method: 'POST',
    body: JSON.stringify({
      p: 'manage-repo',
      e: 'command-run',
      m: { version: appVersion },
    })
  })
}

// --showdir
if (options.showdir) {
  console.log(`\n → Running from directory: ${ __dirname }\n`)
  process.exit()
}

const HOST = options.bind ?? DEFAULT_HOST
const PORT = options.port ?? DEFAULT_PORT

console.log(`\n   ▲ ManageRepo ${ appVersion }`)



// Setting up IO
const io = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Setting up Env
const env = {
  HOSTNAME: HOST,
  PORT: PORT.toString(),
  DISABLE_ANALYTICS: skipAnalytics ? "true" : undefined,
  APP_VERSION: appVersion,
}

// Setting up process
await startManager({
  host: HOST,
  port: PORT.toString(),
})


// Graceful shutdown
const cleanup = () => {
  console.log(`\n → Stopping server on port ${ PORT }...`)
  process.exit()
}

process.on("SIGINT", cleanup) // Ctrl + C
process.on("SIGTERM", cleanup) // Kill command

// Publishing Preparation:
// 1. build the thing first
//    - build command: bun build src/cmd.ts --outdir=dist --minify 
// 2. dont forget to add "bin" field to package.json:
//    "bin": {
//      "manage-repo": "./dist/cmd.js"
//    }
// 3. select file to publish 
//    "files": ["dist"]

// console.log("__dirname", __dirname)                       // --> The "baked" directory of the src files at build time. (my directory is now exposed to other people who install the package, which is not what we want for --showdir)
// console.log("import.meta.dir", import.meta.dir)           // --> The actual directory of where the /dist file is installed (will be undefined on build.)
// console.log("import.meta.path", import.meta.path)         // --> The actual directory of where the /dist file is installed (will be undefined on build.)
// console.log("import.meta.dirname", import.meta.dirname)   // --> The actual directory of where the /dist file is installed (will be undefined on build.)
// console.log("process.cwd()", process.cwd())               // --> The actual directory of where the command is run from (which is what we want for --showdir)


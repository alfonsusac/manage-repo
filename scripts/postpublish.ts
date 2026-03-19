import { logger, success, warn } from "./util"

const log = logger("publish")

const packageJson = await import("../package.json")

success(`${packageJson.version} Published!`)
warn(` npm: https://www.npmjs.com/package/${ packageJson.name }`)
warn(`npmx: https://www.npmjs.com/package/${ packageJson.name }`)
warn("")
warn("bunx: bunx manage-repo")
warn(" npx: npx manage-repo")
warn("pnpx: pnpm --allow-build=bun dlx manage-repo")
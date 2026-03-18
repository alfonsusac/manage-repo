// On Publish
// 1. Make sure tests are passing. If not, ask user to fix tests first.
// 2. Make sure build is working. If not, ask user to fix build first.
// 3. make sure git is initialized and has a remote. if not, ask user to initialize git and add remote first.
// 4. check if git is clean. if not, ask user to commit changes first.
// 5. ensure current commit is pushed to remote. if not, ask user to push changes first.
// 6. check if current version exists in npm. if not, ask user to run `bun version <minor|major|patch>` first.
// 7. check if changelog.ts already has entry for current version. if not, edit changelog.ts first.
// 8. make sure npm is logged on
// 9. run `bun publish` to publish to npm
//10. tag the current commit with the new version and push the tag to remote

import { $ } from "bun"
import { logger, type ChangelogFile } from "./util"

const skipGitCheck = process.argv.includes("--skip-git-check")
const log = logger("publish")


log("Preparing to publish ManageRepo...")

// 1. Check if tests are passing
// log("Running tests...")
// await $`bun test`
//   .catch(error => {
//     console.error("Tests failed. Please fix test errors before publishing.")
//     process.exit(1)
//   })

// 2. Check if build is working
log("Building the project...")
await $`bun run build`.quiet()
  .catch(error => {
    console.error("Build failed. Please fix build errors before publishing.")
    process.exit(1)
  })

// 3. Check if git is initialized and has a remote
log("Checking git status...")
await $`git rev-parse --is-inside-work-tree`
  .text()
  .then(res => {
    if (res.trim() === "true" || skipGitCheck) return
    console.error("Git is not initialized. Please run `git init` and add a remote before publishing.")
    process.exit(1)
  })
await $`git status --porcelain`
  .text()
  .then(res => {
    if (res.trim() === "" || skipGitCheck) return
    console.error("Git has uncommitted changes. Please commit or stash changes before publishing.")
    process.exit(1)
  })
await $`git remote`
  .text()
  .then(res => {
    if (res.trim() || skipGitCheck) return
    console.error("Git has no remote. Please add a remote before publishing.")
    process.exit(1)
  })
await $`git log --branches --not --remotes`
  .text()
  .then(res => {
    if (res.trim() === "" || skipGitCheck) return
    console.error("Current commit is not pushed to remote. Please push changes before publishing.")
    process.exit(1)
  })

// 4. Check if current version exists in npm
log("Checking npm version...")
const packageJson = await import("../package.json")
const npmInfo = await $`npm view manage-repo version`.quiet()
if (npmInfo.text().trim() === packageJson.version) {
  console.error(`Version ${ packageJson.version } already exists in npm. Please run \`bun version <minor|major|patch>\` to update the version before publishing.`)
  process.exit(1)
}

// 5. Check if changelog.ts has entry for current version
log("Checking changelog...")
const { changelog } = await import("../changelog.ts" as string) as { changelog: ChangelogFile }
if (!changelog[ packageJson.version ]) {
  console.error(`Changelog does not have an entry for version ${ packageJson.version }. Please add an entry to changelog.ts before publishing.`)
  process.exit(1)
}
if (!changelog[ packageJson.version ]?.changes?.length) {
  console.error(`Changelog entry for version ${ packageJson.version } is empty. Please add changes to the changelog entry before publishing.`)
  process.exit(1)
}

// 6. Check if npm is logged on
log("Checking npm login status...")
await $`npm whoami`.quiet()
  .catch(error => {
    console.error("Not logged in to npm. Please run `npm login` before publishing.")
    process.exit(1)
  })

log("All checks passed. Ready to publish!")
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
import { logger, warn, type ChangelogFile } from "./util"

const skipGitCheck = process.argv.includes("--skip-git-check")
const log = logger("publish")

log("Preparing to publish ManageRepo...")

const errors: string[] = []

// Files
const packageJson = await import("../package.json")
const { changelog } = await import("../changelog.ts" as string) as { changelog: ChangelogFile }

// 1. Check if tests are passing
// TODO: add test check before publish

log("Checking bin path...")
await checkBinPath()

log("Building the project...")
// await checkBuild()

log("Checking git status...")
await checkGitStatus()

log("Checking npm version...")
await checkIfCurrentVersionExistsInNpm()

log("Checking changelog...")
await checkIfChangelogHasEntry()

log("Checking npm login status...")
await checkIfNpmIsLoggedOn()

if (errors.length) {
  console.error(`Errors found (${errors.length}):`)
  errors.forEach((error, index) => warn(`${index + 1}) ${ error }`))
  console.error("Please fix the above errors before publishing.")
  process.exit(1)
}

log("All checks passed. Ready to publish!")




async function checkBinPath() {
  if (packageJson.bin) {
    for (const [ name, path ] of Object.entries(packageJson.bin)) {
      const exists = await Bun.file(path).exists()
      if (!exists)
        errors.push(`Bin path ${ path } for ${ name } does not exist. Please fix the bin path in package.json before publishing.`)
    }
  }
}

async function checkBuild() {
  await $`bun run build`.quiet()
    .catch(error => {
      errors.push("Build failed. Please fix build errors before publishing.")
    })
}

async function checkGitStatus() {
  await $`git rev-parse --is-inside-work-tree`
    .text()
    .then(res => {
      if (res.trim() === "true" || skipGitCheck) return
      errors.push("Git is not initialized. Please run `git init` and add a remote before publishing.")
    })
  await $`git status --porcelain`
    .text()
    .then(res => {
      if (res.trim() === "" || skipGitCheck) return
      errors.push("Git has uncommitted changes. Please commit or stash changes before publishing.")
    })
  await $`git remote`
    .text()
    .then(res => {
      if (res.trim() || skipGitCheck) return
      errors.push("Git has no remote. Please add a remote before publishing.")
    })
  await $`git log --branches --not --remotes`
    .text()
    .then(res => {
      if (res.trim() === "" || skipGitCheck) return
      errors.push("Current commit is not pushed to remote. Please push changes before publishing.")
    })
}

async function checkIfCurrentVersionExistsInNpm() {
  const npmInfo = await $`npm view manage-repo version`.quiet()
  if (npmInfo.text().trim() === packageJson.version) {
    errors.push(`Version ${ packageJson.version } already exists in npm. Please run \`bun version <minor|major|patch>\` to update the version before publishing.`)
  }
}

async function checkIfChangelogHasEntry() {
  if (!changelog[ packageJson.version ]) {
    errors.push(`Changelog does not have an entry for version ${ packageJson.version }. Please add an entry to changelog.ts before publishing.`)
    return
  }
  if (!changelog[ packageJson.version ]?.changes?.length) {
    errors.push(`Changelog entry for version ${ packageJson.version } is empty. Please add changes to the changelog entry before publishing.`)
    return
  }
}

async function checkIfNpmIsLoggedOn() {
  try {
    await $`npm whoami`.quiet()
  } catch (error) {
    errors.push("Not logged in to npm. Please run `npm login` before publishing.")
  }
}

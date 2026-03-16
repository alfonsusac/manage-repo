// On version,
// - Update the version in package.json
// - Add an entry to changelog.ts with the new version and an empty array of changes
// - Update the README.md with the new version in the installation instructions

import { $, color } from "bun"
import { logger, success, warn } from "./util"

const log = logger("version")

// Make sure there are no uncommitted changes in changelog.ts
const hasUncommittedChanges = await $`git status --porcelain ./changelog.ts`
  .text()
  .then(res => res.trim() !== "")
if (hasUncommittedChanges) {
  console.error("There are uncommitted changes in changelog.ts. Please commit changes before bumping version.")
  process.exit(0)
}


// Get bump type from command line argument or prompt
let param = Bun.argv[ 2 ]
if (param !== "minor" && param !== "patch" && param !== "major") {
  const res = prompt("\x1b[35mSemver bump type (major, minor, patch):\x1b[0m", "patch")
  if (res === "minor" || res === "patch" || res === "major") {
    param = res
  } else {
    console.error("Invalid input. Please enter 'minor', 'patch', or 'major'.")
    process.exit(0)
  }
}


// Create changelog.ts if it doesn't exist
const changelogFile = Bun.file("./changelog.ts")
if (!await changelogFile.exists()) {
  await changelogFile.write(`export const changelog = {} satisfies Record<string, {
    date: string,
    changes: string[],
  }>\n`)
}

// Read Changelog Data
const { changelog } = await import("../changelog.ts" as string) as {
  changelog: Record<string, {
    date: string,
    changes: string[],
  }>
}



// Read package.json
const { default: packageJson } = await import("../package.json")

// Increment version
const versionParts = packageJson.version.split(".").map(Number)
if (param === "patch") {
  (versionParts[ 2 ] !== undefined) && versionParts[ 2 ]++
  if (!versionParts[ 2 ]) console.error("Invalid version format in package.json", "Expected format: x.y.z", `Current version: ${ packageJson.version }`)
}
if (param === "minor") {
  (versionParts[ 1 ] !== undefined) && versionParts[ 1 ]++
  if (!versionParts[ 1 ]) console.error("Invalid version format in package.json", "Expected format: x.y.z", `Current version: ${ packageJson.version }`)
}
if (param === "major") {
  (versionParts[ 0 ] !== undefined) && versionParts[ 0 ]++
  if (!versionParts[ 0 ]) console.error("Invalid version format in package.json", "Expected format: x.y.z", `Current version: ${ packageJson.version }`)
}

// Get new version
const newVersion = versionParts.join(".")

// Update package.json
const newPackageJson = { ...packageJson }
newPackageJson.version = newVersion
await Bun.write("./package.json", JSON.stringify(newPackageJson, null, 2))
log("Updated package.json with new version")

// Update changelog.ts
changelog[ newVersion ] = {
  date: new Date().toISOString(),
  changes: [],
}
const sorted = Object.fromEntries(
  Object.entries(changelog)
    .sort(([ a ], [ b ]) => Bun.semver.order(b, a)) // Sort in descending order (newest first)
)
log("Added changelog entry for version")

const changelogContent = `export const changelog = ${ JSON.stringify(sorted, null, 2) } satisfies Record<string, {
    date: string,
    changes: string[],
  }>\n`
await changelogFile.write(changelogContent)

success(`Version bumped from ${ packageJson.version } -> ${ newVersion }`)
warn(`Please update the ./changelog.ts file with the changes for version ${ newVersion } before publishing.`)

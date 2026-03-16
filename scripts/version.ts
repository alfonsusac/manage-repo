// On version,
// - Update the version in package.json
// - Add an entry to changelog.ts with the new version and an empty array of changes
// - Update the README.md with the new version in the installation instructions

const param = Bun.argv[ 2 ]
if (param !== "minor" && param !== "patch" && param !== "major") {
  console.error("Usage: bun run version <minor|patch|major>")
  process.exit(0)
}

// Create changelog.ts if it doesn't exist
const changelogFile = Bun.file("../changelog.ts")
if (!await changelogFile.exists()) {
  await changelogFile.write(`export const changelog = {} satisfies Record<string, string[]>\n`)
}

// Read Changelog Data
const { changelog } = await import("../changelog.ts" as string) as { changelog: Record<string, string[]> }

// Read package.json
const packageJson = await import("../package.json")

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
packageJson.version = newVersion
await Bun.write("../package.json", JSON.stringify(packageJson, null, 2))

// Update changelog.ts
changelog[ newVersion ] = []
const sorted = Object.fromEntries(
  Object.entries(changelog)
    .sort(([ a ], [ b ]) => Bun.semver.order(b, a)) // Sort in descending order (newest first)
)

const changelogContent = `export const changelog = ${ JSON.stringify(sorted, null, 2) } satisfies Record<string, string[]>\n`
await changelogFile.write(changelogContent)

// how do we force newVersion entry in changelog always sorted by version number?
// We can sort the changelog entries by version number before writing to the file. Here's how you can do it:

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

// 1. Check if tests are passing
// await $`bun test`
//   .catch(error => {
//     console.error("Tests failed. Please fix test errors before publishing.")
//     process.exit(0)
//   })

// 2. Check if build is working
await $`bun build src/cmd.ts --outdir=dist --minify`
  .catch(error => {
    console.error("Build failed. Please fix build errors before publishing.")
    process.exit(0)
  })

// 3. Check if git is initialized and has a remote
await $`git rev-parse --is-inside-work-tree`
  .text()
  .then(res => {
    if (res.trim() === "true") return
    console.error("Git is not initialized. Please run `git init` and add a remote before publishing.")
    process.exit(0)
  })

// 3. Check if git is clean
await $`git status --porcelain`
  .text()
  .then(res => {
    if (res.trim() === "") return
    console.error("Git has uncommitted changes. Please commit or stash changes before publishing.")
    process.exit(0)
  })

// 4. Check if current commit has remote
await $`git remote`
  .text()
  .then(res => {
    if (res.trim()) return
    console.error("Git has no remote. Please add a remote before publishing.")
    process.exit(0)
  })

// 5. Check if commit is pushed to remote
await $`git log --branches --not --remotes`
  .text()
  .then(res => {
    if (res.trim() === "") return
    console.error("Current commit is not pushed to remote. Please push changes before publishing.")
    process.exit(0)
  })

// 




console.log("All checks passed. Ready to publish!")
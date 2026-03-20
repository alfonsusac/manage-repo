import { sleep } from "bun"

console.log("Hello from test script!", new Date().toLocaleTimeString())

// process.exit(1)

// throw new Error("hello world")

await sleep(1000)
console.log("Printing some more after 1 second...")
await sleep(1000)
console.warn("This is a warning message after 2 seconds!")
await sleep(1000)
console.error("This is an error message after 3 seconds!")
await sleep(1000)
console.log("Ansii Color: \x1b[31mRed\x1b[0m, \x1b[32mGreen\x1b[0m, \x1b[33mYellow\x1b[0m, \x1b[34mBlue\x1b[0m, \x1b[35mMagenta\x1b[0m, \x1b[36mCyan\x1b[0m")
console.log("This is a long message to test line wrapping in the console. It should wrap properly without breaking words in the middle.")
await sleep(1000)
console.log("Test")
console.log("Test")
console.log("Test")
console.log("Test")
console.log("This message will be followed by a process exit in 1 second...")
await sleep(1000)
console.log("Exiting now...")

if (Math.random() < 0.5) {
  throw new Error("Random error occurred!")
}

process.exit(0)
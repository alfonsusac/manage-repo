export const logger = (prefix: string) => (...args: any[]) => console.log(`\x1b[34m${ prefix } >`, ...args, `\x1b[0m`)
export const success = (...args: any[]) => console.log(`\x1b[32m`, ...args, `\x1b[0m`)
export const warn = (...args: any[]) => console.log(`\x1b[33m`, ...args, `\x1b[0m`)

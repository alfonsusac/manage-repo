export async function startManager(props: {
  host: string,
  port: string,
}) {
  // Host current cwd
  const cwd = process.cwd()
  const packageJson = await Bun.file(cwd + "/package.json").json()
  console.log(`Starting ${packageJson.name} manager on ${props.host}:${props.port}...`)


} 
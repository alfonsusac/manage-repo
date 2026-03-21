import { dependencyTypes, isValidDependencyType, type DependencyType } from "../../features/dependency"
import { useAsync } from "../../lib/react-async"
import { humanDate } from "../../lib/util-dates"
import { searchNPMPackage } from "../app-fetches"
import { useRouter } from "../app-routes"
import { CloseButton, InputBase, InputBlock, InputDescription, Label, LucideDownload, SelectInputContainer, SelectInputItem, SelectInputItemDescription, useField } from "../app-ui"
import { useDependencies } from "./Dependency"
import { useEffect, useState } from "react"


type DependencyInput = {
  dependencyType: DependencyType,
  sourceType: "npm" | "custom",
} & (
    | {
      sourceType: "npm",
      packageNames: string[],
    }
    | {
      sourceType: "custom",
      name: string,
      value: string,
    }
  )


export function AddDependencyPage() {
  const router = useRouter()
  const dep = useDependencies()

  const field = useField({
    dependencyType: "dependencies",
    sourceType: "npm",
    packageNames: [],
  } as DependencyInput, {
    validate: () => { },
  })

  // If the user is coming from a link with a ?from= query parameter, preselect the corresponding dependency type
  //  but only switch when user is entering the page, not when theyre navigating away. 
  useEffect(() => {
    if (!router.query.from) return
    if (isValidDependencyType(router.query.from)) 
      field.setValue({ ...field.value, dependencyType: router.query.from })
  }, [ router.query.from ])

  return (
    <div className="flex flex-col gap-7 py-4 pb-20">

      <div>
        <Label>Dependency Type</Label>
        <InputBlock>
          <SelectInputContainer className="font-mono flex-wrap p-0">
            {dependencyTypes.map(type => {
              return (
                <SelectInputItem
                  key={type}
                  className="grow items-center whitespace-nowrap"
                  selected={field.value.dependencyType === type}
                  onClick={() => field.setValue({ ...field.value, dependencyType: type })}
                >
                  {{
                    dependencies: "normal",
                    devDependencies: "--dev",
                    peerDependencies: "--peer",
                    optionalDependencies: "--optional",
                  }[ type ]}
                </SelectInputItem>
              )
            })}
          </SelectInputContainer>
        </InputBlock>
        {field.value.dependencyType === "dependencies" && <InputDescription>
          Normal dependencies that are required for your package to function.
        </InputDescription>}
        {field.value.dependencyType === "devDependencies" && <InputDescription>
          Development dependencies that are only used during development and testing.
        </InputDescription>}
        {field.value.dependencyType === "peerDependencies" && <InputDescription>
          Peer dependencies that are expected to be provided by the consuming project.
        </InputDescription>}
        {field.value.dependencyType === "optionalDependencies" && <InputDescription>
          Optional dependencies that are installed if possible, but not required for the package to function.
        </InputDescription>}
      </div>

      <div>
        <Label>Source Type</Label>
        <InputBlock className="">
          <SelectInputContainer className="p-0">
            {([
              "npm",
              "custom",
            ] as const).map(type => {
              return (
                <SelectInputItem
                  key={type}
                  className="grow w-full"
                  selected={field.value.sourceType === type}
                  onClick={() => field.setValue(
                    type === "npm" ? { ...field.value, sourceType: type, packageNames: [] } :
                      { ...field.value, sourceType: type, name: "", value: "" }
                  )}
                >
                  <div className="font-mono">
                    {type}
                  </div>
                </SelectInputItem>
              )
            })}
          </SelectInputContainer>
        </InputBlock>
      </div>

      {field.value.sourceType === "npm" && (
        <div className="flex flex-col gap-2">
          <div>
            <Label>Selected Packages</Label>
            <InputBlock>
              {field.value.packageNames.map(name => {
                return <SelectInputItem
                  key={name}
                  className="px-2 py-0 rounded cursor-pointer group"
                  // onClick={() => props.onSelect(pkg.package.name)}
                  selected={false}
                >
                  <div className="font-mono text-fg/75 flex items-center w-full py-0">
                    <div className="grow group-hover:text-fg">
                      {name}
                    </div>
                    <CloseButton onClick={() => {
                      if (field.value.sourceType !== "npm") return
                      field.setValue({
                        ...field.value,
                        packageNames: field.value.packageNames.filter(n => n !== name),
                      })
                    }} />
                  </div>
                </SelectInputItem>
              })}
              {field.value.packageNames.length === 0 && <span className="text-sm text-fg-3 self-center py-1">No packages selected.</span>}
            </InputBlock>
          </div>

          <button className="button py-2 self-end px-6">
            Install
          </button>

          <NpmDependencySearch
            selectedPackages={field.value.packageNames}
            onSelect={(packageName) => {
              if (field.value.sourceType !== "npm") return
              if (!field.value.packageNames.includes(packageName)) {
                field.setValue({
                  ...field.value,
                  packageNames: [ ...field.value.packageNames, packageName ],
                })
              } else {
                field.setValue({
                  ...field.value,
                  packageNames: field.value.packageNames.filter(name => name !== packageName),
                })
              }
            }}
          />
        </div>
      )}



    </div>
  )
}



function NpmDependencySearch(props: {
  selectedPackages?: string[],
  onSelect: (packageName: string) => void
}) {

  const [ value, setValue ] = useState("")

  const [ result, isLoading, reset ] = useAsync(async (signal) => {
    if (value === "") return []
    if (value.length < 3) return []
    await new Promise(resolve => setTimeout(resolve, 250))
    if (signal.aborted) throw new Error("Search aborted")
    const res = await searchNPMPackage(value)
    if (res === "fetch error") throw new Error("Network error while searching for packages.")
    if (res === "malformed error") throw new Error("Received malformed response from server.")
    if (res === "unexpected server response") throw new Error("Received unexpected response from server.")
    return res

  }, [ value ])

  return (
    <div className="flex flex-col">
      <Label>Search package</Label>
      <InputBlock>
        <InputBase
          type="text" className="input" placeholder="e.g. react"
          value={value}
          onChange={e => setValue(e.target.value)}
        />
      </InputBlock>
      <InputBlock className="min-h-60 flex flex-col gap-px p-2">
        {value === "" && <span className="text-sm text-fg-3 p-2">Start typing to search for packages...</span>}
        {value.length > 0 && value.length < 3 && <span className="text-sm text-fg-3 p-2">Keep typing to search for packages...</span>}
        {result.status === "error" ? <span className="text-sm text-red-500 p-2">{result.error}</span> :
          result.status === "loading" ? <span className="text-sm text-fg-3 p-2">Searching...</span> :
            result.status === "idle" ? null :
              result.result.map(pkg => {
                return (
                  <SelectInputItem
                    key={pkg.package.name}
                    className="p-2 rounded cursor-pointer group"
                    onClick={() => props.onSelect(pkg.package.name)}
                    selected={props.selectedPackages?.includes(pkg.package.name) ?? false}
                  >
                    <div className="font-mono text-fg/75 flex w-full">
                      <div className="grow group-hover:text-fg">
                        {pkg.package.name}
                        <span className="text-sm text-fg-3">
                          ({pkg.package.version})
                        </span>
                      </div>
                      <div className="shrink-0 hidden xs:flex! flex gap-1 items-center text-fg-3">
                        {pkg.downloads.monthly.toLocaleString()}
                        <LucideDownload />
                      </div>
                    </div>
                    <div className="text-sm text-fg-3 line-clamp-1 flex w-full gap-2">
                      <div className="grow text-fg-3 line-clamp-1">
                        {pkg.package.description}
                      </div>
                    </div>
                    <div className="text-fg-4">
                      {humanDate(pkg.package.date)}
                    </div>
                  </SelectInputItem>
                )
              })
        }
      </InputBlock>
    </div>
  )
}





// Add Dependency Page
// - Source Type:
//   [npm | git | github | local]
//   - npm: 
//     - search npm keywords
//     - list of matching packages: name, description, latest version, weekly download count
//     - version range
//       - autofill: [latest | tags (latest, next, etc.)]
//     - is aliased checkbox
// - Dependency Type:
//   [Dependency | Dev Dependency | Peer Dependency | Optional Dependency]
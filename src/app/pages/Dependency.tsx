import { usePackageJson } from "../../features/package-json-client"
import { useRouter } from "../app-routes"
import { AddButton, H2 } from "../app-ui"

type Dependency = {
  name: string,
  version: string
}

export function useDependencies() {
  const [ packageJson, updatePackageJson ] = usePackageJson()
  const dependencies: Dependency[] = Object
    .entries(packageJson.dependencies || {})
    .map(([ name, version ]) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const devDependencies: Dependency[] = Object
    .entries(packageJson.devDependencies || {})
    .map(([ name, version ]) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const peerDependencies: Dependency[] = Object
    .entries(packageJson.peerDependencies || {})
    .map(([ name, version ]) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const optionalDependencies: Dependency[] = Object
    .entries(packageJson.optionalDependencies || {})
    .map(([ name, version ]) => ({ name, version }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return {
    dependencies,
    devDependencies,
    peerDependencies,
    optionalDependencies,
  }
}

export function DependencyPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-12 py-4 pb-20">
      <div className="flex flex-col gap-6">
        <H2>Dependencies</H2>
        <p className="text-fg-2 -mt-4 text-sm">
          These are the dependencies of your project. You can add, remove, or update them as needed. Make sure to keep your dependencies up to date to ensure compatibility and security.
        </p>
        <NormalDependencyList />
      </div>
      <div className="flex flex-col gap-6">
        <H2>Dev Dependencies</H2>
        <p className="text-fg-2 -mt-4 text-sm">
          These are the development dependencies of your project. They are only needed during development and testing, and will not be included in the production build. You can add, remove, or update them as needed to support your development workflow.
        </p>
        <DevDependencyList />
      </div>
      <div className="flex flex-col gap-6">
        <H2>Peer Dependencies</H2>
        <p className="text-fg-2 -mt-4 text-sm">
          These are the peer dependencies of your project. They are packages that your project depends on, but are not included in your project's dependencies. They are typically used for libraries and plugins that need to work with a specific version of a dependency. Make sure to install the required peer dependencies to ensure your project works correctly.
        </p>
        <PeerDependencyList />
      </div>
      <div className="flex flex-col gap-6">
        <H2>Optional Dependencies</H2>
        <p className="text-fg-2 -mt-4 text-sm">
          These are the optional dependencies of your project. They are packages that your project can use, but are not required for it to work. They are typically used for features that are not essential to the core functionality of your project, but can provide additional functionality if they are installed. You can add, remove, or update them as needed to enhance your project.
        </p>
        <OptionalDependencyList />
      </div>


    </div>
  )
}


function DependencyList(props: {
  type: keyof ReturnType<typeof useDependencies>
}) {
  const dep = useDependencies()
  const deps = dep[ props.type ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col p-3 px-4 bg-bg-2 rounded-lg font-mono text-sm">
        {deps.map((dep) => {
          return <div key={dep.name}
            className="flex hover:bg-bg-3 -mx-4 px-4 py-1"
          >
            <div className="grow">{dep.name}</div>
            <div className="shrink-0">{dep.version}</div>
          </div>
        })}
        {
          deps.length === 0 && (
            <div className="text-fg-3">
              No dependencies found.
            </div>
          )
        }
      </div>

      <AddDependencyButton type={props.type} />
    </div>

  )
}




function NormalDependencyList() {
  return (
    <>
      <DependencyList type="dependencies" />
    </>
  )
}

function DevDependencyList() {
  return (
    <>
      <DependencyList type="devDependencies" />
    </>
  )
}

function PeerDependencyList() {
  return (
    <>
      <DependencyList type="peerDependencies" />
    </>
  )
}

function OptionalDependencyList() {
  return (
    <>
      <DependencyList type="optionalDependencies" />
    </>
  )
}











function AddDependencyButton(props: {
  type: keyof ReturnType<typeof useDependencies>
}) {
  const router = useRouter()
  return (
    <AddButton
      label={`Add ${ {
        dependencies: "Dependency",
        devDependencies: "Dev Dependency",
        peerDependencies: "Peer Dependency",
        optionalDependencies: "Optional Dependency"
      }[ props.type ]
        }`}
      onClick={() => router.navigate(`/dependencies/add?from=${ props.type }`, "forward")}
    />
  )
}

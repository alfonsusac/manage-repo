export const dependencyTypes = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const

export type DependencyType = (typeof dependencyTypes)[number]

export function isValidDependencyType(value: string): value is DependencyType {
  return dependencyTypes.includes(value as DependencyType)
}



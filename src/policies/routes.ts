export const siteOrigin = 'https://zenlessentials.org'
export const siteTitle = 'Zenlessentials — ZZZ Companion'
export const siteDescription = 'A free Zenless Zone Zero companion. Track the story, look up Agents and equipment, and build squads.'

export const policies = {
  '/privacy': { title: 'Privacy Policy', description: 'How Zenlessentials handles sign-in, saves, and browser storage.', file: 'PRIVACY.md' },
  '/terms': { title: 'Terms of Service', description: 'Terms for using the hosted Zenlessentials fan companion.', file: 'TERMS.md' },
  '/code-of-conduct': { title: 'Code of Conduct', description: 'Community standards for contributing to Zenlessentials.', file: 'CODE_OF_CONDUCT.md' },
} as const

export type PolicyPath = keyof typeof policies
export const policyPaths = Object.keys(policies) as PolicyPath[]

export function isPolicyPath(path: string): path is PolicyPath {
  return Object.hasOwn(policies, path)
}

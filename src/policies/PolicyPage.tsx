import { Link } from 'react-router-dom'
import body from 'virtual:policy-content'
import { policies, policyPaths } from './routes'
import type { PolicyPath } from './routes'

export function PolicyPage({ path }: { path: PolicyPath }) {
  return <article className="policy-document panel">
    <h1>{policies[path].title}</h1>
    <div className="policy-copy" dangerouslySetInnerHTML={{ __html: body[path] }} />
  </article>
}

export function PolicyLinks({ includeConduct = true }: { includeConduct?: boolean }) {
  return <nav className="policy-links" aria-label="Project policies">
    {policyPaths.filter((path) => includeConduct || path !== '/code-of-conduct').map((path) =>
      <Link key={path} to={path}>{policies[path].title}</Link>)}
  </nav>
}

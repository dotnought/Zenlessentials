import { Component } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export class DatabaseBoundary extends Component<{ children: ReactNode; collection?: boolean }, { error: boolean }> {
  state = { error: false }

  static getDerivedStateFromError() {
    return { error: true }
  }

  render() {
    if (!this.state.error) return this.props.children
    const { collection } = this.props
    const Heading = collection ? 'h2' : 'h1'
    return <section className="empty panel">
      <Heading>{collection ? 'Collection' : 'Database'} unavailable</Heading>
      <p>Open {collection ? 'your collection' : 'the database'} while online to download the latest catalog.</p>
      <div className="settings-actions">
        <button type="button" className="secondary-button" onClick={() => window.location.reload()}>Retry</button>
        <Link to={collection ? '/profile' : '/timeline'} className="secondary-button">{collection ? 'View story progress' : 'Return to timeline'}</Link>
      </div>
    </section>
  }
}

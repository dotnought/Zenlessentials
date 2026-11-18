import { Component } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export class DatabaseBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false }

  static getDerivedStateFromError() {
    return { error: true }
  }

  render() {
    if (!this.state.error) return this.props.children
    return <section className="empty panel">
      <h1>Database unavailable</h1>
      <p>Open the database while online to download the latest catalog.</p>
      <div className="settings-actions">
        <button type="button" className="secondary-button" onClick={() => window.location.reload()}>Retry</button>
        <Link to="/timeline" className="secondary-button">Return to timeline</Link>
      </div>
    </section>
  }
}


import { Link, Route, Routes } from 'react-router-dom'

import { BreadcrumbBar } from './components/BreadcrumbBar'
import { CommandCenterPage } from './pages/CommandCenter'
import { AnchorPage } from './pages/Anchor'
import { ZonePage } from './pages/Zones'
import { HIVE_APP_NAME } from './config'

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <strong style={{ fontSize: '1.25rem' }}>{HIVE_APP_NAME}</strong>
        </Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/">Command Center</Link>
        </nav>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <BreadcrumbBar />
    </div>
  )
}

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<CommandCenterPage />} />
        <Route path="/zones/:slug" element={<ZonePage />} />
        <Route path="/anchor/:anchorId" element={<AnchorPage />} />
      </Routes>
    </AppShell>
  )
}

export default App

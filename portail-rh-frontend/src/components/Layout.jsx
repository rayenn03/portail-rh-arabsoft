import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout({ children, title }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title={title} />
        <div style={{ flex: 1, padding: '32px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
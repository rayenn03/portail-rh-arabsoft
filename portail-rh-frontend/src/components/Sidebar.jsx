import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, memo } from 'react'
import api from '../api/axios'
import p from './Sidebar.module.css'

const NAV_ITEMS = [
  { path:'/dashboard',       icon:'📊', label:'Tableau de bord',        roles:['admin','chef','employe'] },
  { path:'/demandes',        icon:'📋', label:'Mes Demandes',            roles:['employe'] },
  { path:'/all-demandes',    icon:'📂', label:'Toutes les Demandes',     roles:['admin','chef'] },
  { path:'/employes',        icon:'👥', label:'Employés',                roles:['admin'] },
  { path:'/messages',        icon:'💬', label:'Messagerie',              roles:['admin','chef','employe'] },
  { path:'/password-resets', icon:'🔑', label:'Réinit. mots de passe',   roles:['admin'] },
  { path:'/profil',          icon:'👤', label:'Mon Profil',              roles:['admin','chef','employe'] },
]

function Sidebar() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const location         = useLocation()

  // ── État collapse persisté ────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebarCollapsed') === 'true'
  )

  // ── Badge notifications non lues ──────────────────────────────────────────
  const [unread, setUnread]         = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)

  // Sync CSS var → Layout s'adapte automatiquement
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '64px' : '240px')
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }, [collapsed])

  // Init CSS var au montage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed') === 'true'
    document.documentElement.style.setProperty('--sidebar-w', saved ? '64px' : '240px')
  }, [])

  // Fetch non lues (polling 30s) — notifications + messages
  useEffect(() => {
    const fetch = () => {
      api.get('/notifications').then(r => setUnread(r.data.non_lues || 0)).catch(() => {})
      api.get('/messages/non-lus').then(r => setUnreadMsgs(r.data.non_lus || 0)).catch(() => {})
    }
    fetch()
    const t = setInterval(fetch, 30000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/') }
  const initials     = user ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}` : 'U'
  const roleLabel    = { admin:'Gestionnaire RH', chef:'Chef Hiérarchique', employe:'Employé' }[user?.role] || 'Utilisateur'
  const filtered     = NAV_ITEMS.filter(i => i.roles.includes(user?.role))

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className={`${p.sidebar} ${collapsed ? p.sidebarCollapsed : ''}`}>

        {/* ── Logo ── */}
        <div className={`${p.logo} ${collapsed ? p.logoCollapsed : ''}`}>
          <div className={p.logoMark}>A</div>
          {!collapsed && (
            <span className={p.logoName}>
              Arab<span style={{color:'var(--accent)'}}>Soft</span>
            </span>
          )}
        </div>

        {/* ── User info ── */}
        {!collapsed && (
          <div className={p.userBox}>
            <div className={p.avatar}>
              {user?.photo_url
                ? <img src={user.photo_url} alt="" className={p.avatarImg} />
                : initials}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div className={p.userName} title={`${user?.prenom} ${user?.nom}`}>
                {user?.prenom} {user?.nom}
              </div>
              <div className={p.userRole}>{roleLabel}</div>
            </div>
          </div>
        )}

        {/* Avatar seul en mode réduit */}
        {collapsed && (
          <div style={{padding:'12px 0', display:'flex', justifyContent:'center'}}>
            <div className={p.avatar} style={{width:'36px', height:'36px'}} title={`${user?.prenom} ${user?.nom}`}>
              {user?.photo_url
                ? <img src={user.photo_url} alt="" className={p.avatarImg} />
                : initials}
            </div>
          </div>
        )}

        {/* ── Nav ── */}
        <nav className={p.nav}>
          {!collapsed && <div className={p.navSection}>Navigation</div>}

          {filtered.map(item => {
            const active = location.pathname === item.path
            const isDashboard = item.path === '/dashboard'
            const isMessages  = item.path === '/messages'
            const badgeCount  = isDashboard ? unread : (isMessages ? unreadMsgs : 0)
            const showBadge   = badgeCount > 0
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-item ${p.navItem} ${collapsed ? p.navItemCollapsed : ''} ${active ? p.navItemActive : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {active && <div className={p.activeLine} />}

                <div style={{position:'relative', display:'inline-flex'}}>
                  <span className={p.navIcon}>{item.icon}</span>
                  {/* Badge non lues */}
                  {showBadge && (
                    <span className={p.badge}>
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>

                {!collapsed && <span style={{flex:1}}>{item.label}</span>}

                {/* Badge inline (mode étendu) */}
                {!collapsed && showBadge && (
                  <span className={p.badgeInline}>{badgeCount > 9 ? '9+' : badgeCount}</span>
                )}
              </div>
            )
          })}
        </nav>

        {/* ── Bouton collapse ── */}
        <div className={`${p.collapseArea} ${collapsed ? p.collapseAreaCollapsed : ''}`}>
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`${p.collapseBtn} ${collapsed ? p.collapseBtnCollapsed : ''}`}
            title={collapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
          >
            {collapsed ? '→' : '← Réduire'}
          </button>
        </div>

        {/* ── Logout ── */}
        <div className={`${p.bottom} ${collapsed ? p.bottomCollapsed : ''}`}>
          <button
            onClick={handleLogout}
            className={`${p.logoutBtn} ${collapsed ? p.logoutBtnCollapsed : ''}`}
            title={collapsed ? 'Se déconnecter' : undefined}
          >
            <span>🚪</span>
            {!collapsed && <span>Se déconnecter</span>}
          </button>
        </div>

      </div>
    </>
  )
}

export default memo(Sidebar)

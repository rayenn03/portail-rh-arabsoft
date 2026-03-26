import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const initials = user ? `${user.prenom?.[0]}${user.nom?.[0]}` : 'U'

  const roleLabel = {
    admin: 'Gestionnaire RH',
    chef: 'Chef Hiérarchique',
    employe: 'Employé',
  }[user?.role] || 'Utilisateur'

const navItems = [
  { path:'/dashboard',    icon:'📊', label:'Tableau de bord',      roles:['admin','chef','employe'] },
  { path:'/demandes',     icon:'📋', label:'Mes Demandes',          roles:['employe'] },          // ✅ employe seulement
  { path:'/all-demandes', icon:'📂', label:'Toutes les Demandes',   roles:['admin','chef'] },      // ✅ admin + chef
  { path:'/employes',     icon:'👥', label:'Employés',              roles:['admin'] },             // ✅ admin seulement
  { path:'/chatbot',      icon:'💬', label:'Assistant RH',          roles:['admin','chef','employe'] },
  { path:'/profil',       icon:'👤', label:'Mon Profil',            roles:['admin','chef','employe'] },
]

  const filtered = navItems.filter(item => item.roles.includes(user?.role))

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <div style={styles.sidebar}>

        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoMark}>A</div>
          <span style={styles.logoName}>
            Arab<span style={{color:'var(--accent)'}}>Soft</span>
          </span>
        </div>

        {/* User info */}
        <div style={styles.userBox}>
          <div style={styles.avatar}>{initials}</div>
          <div>
            <div style={styles.userName}>{user?.prenom} {user?.nom}</div>
            <div style={styles.userRole}>{roleLabel}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          <div style={styles.navSection}>Navigation</div>
          {filtered.map(item => {
            const active = location.pathname === item.path
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{...styles.navItem, ...(active ? styles.navItemActive : {})}}
              >
                {active && <div style={styles.activeLine} />}
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={styles.bottom}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            🚪 Se déconnecter
          </button>
        </div>
      </div>
    </>
  )
}

const styles = {
  sidebar:{width:'240px',height:'100vh',background:'white',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',position:'fixed',top:0,left:0,zIndex:100},
  logo:{padding:'20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'10px'},
  logoMark:{width:'32px',height:'32px',background:'var(--accent)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'14px',fontFamily:'Instrument Serif, serif',fontStyle:'italic'},
  logoName:{fontSize:'16px',fontWeight:600,color:'var(--text)',letterSpacing:'-0.3px'},
  userBox:{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:'10px'},
  avatar:{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg, var(--accent), #c47c25)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:'13px',color:'white',flexShrink:0},
  userName:{fontSize:'13px',fontWeight:600,color:'var(--text)'},
  userRole:{fontSize:'11px',color:'var(--accent)',fontWeight:500},
  nav:{flex:1,padding:'12px 0',overflowY:'auto'},
  navSection:{padding:'16px 20px 6px',fontSize:'10px',textTransform:'uppercase',letterSpacing:'1px',color:'var(--text3)',fontWeight:600},
  navItem:{display:'flex',alignItems:'center',gap:'10px',padding:'10px 20px',fontSize:'13.5px',color:'var(--text2)',cursor:'pointer',transition:'all 0.15s',position:'relative'},
  navItemActive:{color:'var(--accent)',background:'rgba(255,45,32,0.05)'},
  activeLine:{position:'absolute',left:0,top:'6px',bottom:'6px',width:'3px',background:'var(--accent)',borderRadius:'0 3px 3px 0'},
  navIcon:{width:'18px',textAlign:'center',fontSize:'16px'},
  bottom:{padding:'16px 20px',borderTop:'1px solid var(--border)'},
  logoutBtn:{display:'flex',alignItems:'center',gap:'8px',fontSize:'13px',color:'var(--text2)',cursor:'pointer',background:'none',border:'none',fontFamily:'Inter, sans-serif',transition:'color 0.15s',padding:0},
}
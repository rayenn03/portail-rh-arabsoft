import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Topbar({ title }) {
  const { user } = useAuth()
  const [notifOpen, setNotifOpen]   = useState(false)
  const [notifs, setNotifs]         = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifs = () => {
    api.get('/notifications')
    .then(res => {
    const data = res.data.notifications || []
    setNotifs(data)
    setUnreadCount(res.data.non_lues || 0)
  })
      .catch(() => {})
  }

  useEffect(() => {
    fetchNotifs()
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    try {
      await api.put('/notifications/tout-lu')
      fetchNotifs()
    } catch (e) {}
  }

  const markOneRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/lu`)
      fetchNotifs()
    } catch (e) {}
  }

  return (
    <div style={styles.topbar}>
      <div style={styles.title}>{title}</div>
      <div style={styles.actions}>

        {/* Notification button */}
        <div style={styles.notifBtn} onClick={() => { setNotifOpen(!notifOpen); }}>
          🔔
          {unreadCount > 0 && (
            <div style={styles.notifBadge}>{unreadCount}</div>
          )}

          {/* Panel */}
          {notifOpen && (
            <div style={styles.notifPanel} onClick={e => e.stopPropagation()}>
              <div style={styles.notifHeader}>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={styles.markAllBtn}>
                    Tout marquer lu
                  </button>
                )}
              </div>

              {notifs.length === 0 ? (
                <div style={styles.notifEmpty}>
                  🔕 Aucune notification
                </div>
              ) : (
                notifs.slice(0, 10).map((n, i) => (
                  <div
                    key={i}
                    onClick={() => markOneRead(n.id)}
                    style={{...styles.notifItem, ...(n.lu ? {} : styles.notifUnread)}}
                  >
                    <div style={styles.notifItemTitle}>
                      {!n.lu && <span style={styles.unreadDot}>●</span>}
                      {n.message}
                    </div>
                    <div style={styles.notifItemTime}>
                      {n.created_at
                        ? new Date(n.created_at).toLocaleString('fr-FR', {
                            day:'2-digit', month:'2-digit',
                            hour:'2-digit', minute:'2-digit'
                          })
                        : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div style={styles.avatar}>
          {user?.prenom?.[0]}{user?.nom?.[0]}
        </div>
      </div>
    </div>
  )
}

const styles = {
  topbar:{height:'64px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 32px',background:'white',position:'sticky',top:0,zIndex:50},
  title:{fontFamily:'Instrument Serif, serif',fontSize:'20px',fontWeight:400,color:'var(--text)'},
  actions:{display:'flex',alignItems:'center',gap:'12px'},
  notifBtn:{width:'36px',height:'36px',borderRadius:'8px',background:'var(--surface)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'16px',position:'relative'},
  notifBadge:{position:'absolute',top:'-6px',right:'-6px',background:'var(--accent)',color:'white',fontSize:'10px',fontWeight:700,width:'18px',height:'18px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid white'},
  notifPanel:{position:'absolute',top:'44px',right:0,width:'340px',background:'white',border:'1px solid var(--border)',borderRadius:'12px',boxShadow:'var(--shadow-lg)',zIndex:200,maxHeight:'420px',overflowY:'auto'},
  notifHeader:{padding:'14px 16px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:'14px',color:'var(--text)',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'white'},
  markAllBtn:{fontSize:'11px',color:'var(--accent)',background:'none',border:'none',cursor:'pointer',fontFamily:'Inter, sans-serif',fontWeight:500},
  notifEmpty:{padding:'32px',textAlign:'center',fontSize:'13px',color:'var(--text3)'},
  notifItem:{padding:'12px 16px',borderBottom:'1px solid rgba(228,228,231,0.5)',cursor:'pointer',transition:'background 0.1s'},
  notifUnread:{background:'#FFF9F5'},
  notifItemTitle:{fontSize:'13px',color:'var(--text)',marginBottom:'4px',lineHeight:1.4,display:'flex',alignItems:'flex-start',gap:'6px'},
  notifItemTime:{fontSize:'11px',color:'var(--text3)'},
  unreadDot:{color:'var(--accent)',fontSize:'10px',flexShrink:0,marginTop:'2px'},
  avatar:{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#c47c25)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:600,fontSize:'12px',color:'white',cursor:'pointer'},
}
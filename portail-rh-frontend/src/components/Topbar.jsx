import { useState, useEffect, memo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../api/axios'
import { createEcho } from '../api/echo'
import p from './Topbar.module.css'

function Topbar({ title }) {
  const { user, token } = useAuth()
  const { mode, toggle } = useTheme()
  const [notifOpen, setNotifOpen]     = useState(false)
  const [notifs, setNotifs]           = useState([])
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
    // Filet de sécurité (le temps réel est géré par WebSocket Reverb)
    // → polling allégé à 5 min pour économiser les requêtes
    const interval = setInterval(fetchNotifs, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // ─── Souscription WebSocket (temps réel) ─────────────────────────────────
  useEffect(() => {
    if (!user?.id || !token) return
    const echo = createEcho(token)
    try {
      echo.private(`user.${user.id}`)
        .listen('.notification.created', (e) => {
          setNotifs(prev => [{ ...e, lu: false }, ...prev])
          setUnreadCount(c => c + 1)
          try { new Audio('/notification.mp3').play().catch(() => {}) } catch {}
        })
    } catch {}
    // Cleanup garanti : disconnect() dans echo.js pose destroyed=true
    // même si la connexion WS n'est pas encore établie
    return () => { echo.disconnect() }
  }, [user?.id, token])

  const markAllRead = async () => {
    try { await api.put('/notifications/tout-lu'); fetchNotifs() } catch {}
  }

  const markOneRead = async (id) => {
    try { await api.put(`/notifications/${id}/lu`); fetchNotifs() } catch {}
  }

  return (
    <div className={p.topbar}>
      <div className={p.title}>{title}</div>
      <div className={p.actions}>

        {/* Toggle thème */}
        <div
          className={`btn-hover ${p.themeBtn}`}
          onClick={toggle}
          title={mode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {mode === 'dark' ? '☀️' : '🌙'}
        </div>

        {/* Notification button */}
        <div className={`btn-hover ${p.notifBtn}`} onClick={() => setNotifOpen(!notifOpen)}>
          🔔
          {unreadCount > 0 && (
            <div className={p.notifBadge}>{unreadCount}</div>
          )}

          {/* Panel */}
          {notifOpen && (
            <div className={p.notifPanel} style={{animation:'slideUp 0.2s ease-out'}} onClick={e => e.stopPropagation()}>
              <div className={p.notifHeader}>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className={p.markAllBtn}>
                    Tout marquer lu
                  </button>
                )}
              </div>

              {notifs.length === 0 ? (
                <div className={p.notifEmpty}>
                  🔕 Aucune notification
                </div>
              ) : (
                notifs.slice(0, 10).map((n, i) => (
                  <div
                    key={n.id || i}
                    onClick={() => markOneRead(n.id)}
                    className={`notif-item ${p.notifItem} ${n.lu ? '' : p.notifUnread}`}
                  >
                    <div className={p.notifItemTitle}>
                      {!n.lu && <span className={p.unreadDot}>●</span>}
                      {n.message}
                    </div>
                    <div className={p.notifItemTime}>
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
        <div className={p.avatar}>
          {user?.photo_url
            ? <img src={user.photo_url} alt="" className={p.avatarImg} />
            : <>{user?.prenom?.[0]}{user?.nom?.[0]}</>}
        </div>
      </div>
    </div>
  )
}

export default memo(Topbar)

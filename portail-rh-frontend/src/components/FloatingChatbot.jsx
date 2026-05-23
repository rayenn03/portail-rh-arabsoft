import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChatPanel from './ChatPanel'
import p from './FloatingChatbot.module.css'

/**
 * <FloatingChatbot> — bulle de chat persistante sur toutes les pages avec Layout.
 *
 * - Bouton 🤖 en bas à gauche (évite conflit avec toasts top-right)
 * - Clic → ouvre mini-fenêtre 380×540 px
 * - Bouton ⛶ → bascule vers /chatbot (full page) en conservant l'historique
 * - Bouton ✕ → ferme la fenêtre (le bouton FAB réapparaît)
 * - Historique partagé avec la page /chatbot (même storageKey)
 * - Masqué sur la page /chatbot (inutile d'avoir 2 chats)
 */
export default function FloatingChatbot() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)

  // Affiche le point vert pulsant tant que l'utilisateur n'a pas encore ouvert le chat
  useEffect(() => {
    try {
      const seen = localStorage.getItem('chatbot_seen')
      if (!seen) setHasUnread(true)
    } catch {}
  }, [])

  const handleOpen = () => {
    setOpen(true)
    setHasUnread(false)
    try { localStorage.setItem('chatbot_seen', '1') } catch {}
  }

  const handleExpand = () => {
    setOpen(false)
    navigate('/chatbot')
  }

  // Ne rien afficher si pas connecté ou si on est déjà sur /chatbot
  if (!user) return null
  if (location.pathname === '/chatbot') return null

  return (
    <>
      {/* Fenêtre */}
      {open && (
        <div className={p.panel}>
          <ChatPanel
            mode="compact"
            storageKey="chatbot_history"
            onClose={() => setOpen(false)}
            onExpand={handleExpand}
          />
        </div>
      )}

      {/* Bouton flottant (toujours visible sauf si la fenêtre est ouverte) */}
      {!open && (
        <button
          className={p.fab}
          onClick={handleOpen}
          title="Assistant RH"
          aria-label="Ouvrir l'assistant RH"
        >
          🤖
          {hasUnread && <span className={p.fabDot} />}
        </button>
      )}
    </>
  )
}

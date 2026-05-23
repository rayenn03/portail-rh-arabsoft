import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import p from '../pages/Chatbot.module.css'

/**
 * <ChatPanel> — composant chat réutilisable
 *
 * Props:
 *   - mode:        'full' (page /chatbot) | 'compact' (bulle flottante)
 *   - storageKey:  clé localStorage pour persister l'historique (optionnel)
 *   - onClose:     callback appelé quand on clique sur ✕ (compact uniquement)
 *   - onExpand:    callback appelé quand on clique sur ⛶ "voir en grand"
 *   - shortcuts:   liste de raccourcis (par défaut : selon rôle)
 */
export default function ChatPanel({
  mode = 'full',
  storageKey = 'chatbot_history',
  onClose,
  onExpand,
  shortcuts,
}) {
  const { user } = useAuth()

  const welcome = useCallback(() => ({
    role: 'bot',
    text: `Bonjour **${user?.prenom || ''}** ! Je suis **RHConnect**, votre assistant RH ArabSoft.\n\nComment puis-je vous aider aujourd'hui ?`,
  }), [user?.prenom])

  // ── Restaure l'historique depuis localStorage au premier rendu ─────────
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return [welcome()]
  })

  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const abortRef  = useRef(null)
  const bottomRef = useRef(null)

  // Persister à chaque changement (max 50 messages)
  useEffect(() => {
    try {
      const toSave = messages.slice(-50)
      localStorage.setItem(storageKey, JSON.stringify(toSave))
    } catch {}
  }, [messages, storageKey])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Shortcuts contextuels par rôle ─────────────────────────────────────
  const defaultShortcuts = (() => {
    const base = [
      { label: '📅 Solde congé',    text: 'Quel est mon solde de congé restant ?' },
      { label: '📋 Mes demandes',   text: 'Quel est le statut de mes demandes ?' },
      { label: '🏖️ Demande congé',  text: 'Comment soumettre une demande de congé ?' },
      { label: '💰 Faire un prêt',  text: 'Comment faire une demande de prêt ?' },
      { label: '📄 Attestation',    text: 'Comment obtenir une attestation de travail ?' },
      { label: '⏰ Autorisation',   text: 'Comment demander une autorisation de sortie ?' },
    ]
    if (user?.role === 'chef') {
      return [
        { label: '👥 Demandes équipe', text: 'Comment valider les demandes de mon équipe ?' },
        ...base.slice(0, 4),
      ]
    }
    if (user?.role === 'admin') {
      return [
        { label: '📊 Stats RH',        text: 'Donne-moi un résumé des demandes en attente.' },
        { label: '✅ À valider',       text: 'Quelles demandes attendent ma validation admin ?' },
        ...base.slice(2, 5),
      ]
    }
    return base
  })()

  const activeShortcuts = shortcuts || defaultShortcuts

  // ── Envoi d'un message ─────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    // Construire l'historique pour Gemini (max 6 tours = 12 messages, sans le welcome)
    const history = messages
      .slice(1) // saute le welcome bot
      .slice(-12)
      .map(m => ({
        role: m.role === 'bot' ? 'model' : 'user',
        text: m.text,
      }))

    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)

    // AbortController pour annuler une requête en cours
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const res = await api.post('/chatbot',
        { message: msg, history },
        { signal: abortRef.current.signal, timeout: 30000 },
      )
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }])
    } catch (err) {
      // Si annulé par l'utilisateur, ne rien ajouter
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return

      const status = err?.response?.status
      let txt = 'Désolé, je rencontre un problème technique. Veuillez réessayer.'
      if (status === 429) txt = '⏱️ Vous envoyez des messages trop rapidement. Patientez quelques secondes…'
      else if (status === 401) txt = '🔒 Votre session a expiré. Reconnectez-vous.'
      else if (err?.code === 'ECONNABORTED') txt = '⏱️ Le serveur met trop de temps à répondre. Réessayez.'

      setMessages(prev => [...prev, { role: 'bot', text: txt, error: true }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Nouvelle conversation ──────────────────────────────────────────────
  const resetConversation = () => {
    abortRef.current?.abort()
    setMessages([welcome()])
    setInput('')
    setLoading(false)
    try { localStorage.removeItem(storageKey) } catch {}
  }

  // ── Copier une réponse ─────────────────────────────────────────────────
  const copyText = (text) => {
    try {
      navigator.clipboard.writeText(text)
    } catch {}
  }

  // ── Rendu Markdown léger : **gras**, listes, sauts de ligne ────────────
  const formatLine = (line, key) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={`${key}-${i}`} style={{ color: 'var(--accent)' }}>{part.slice(2, -2)}</strong>
      }
      // Italique simple
      const italicParts = part.split(/(_[^_]+_)/)
      return italicParts.map((sub, j) => {
        if (sub.startsWith('_') && sub.endsWith('_') && sub.length > 2) {
          return <em key={`${key}-${i}-${j}`} style={{ opacity: 0.75 }}>{sub.slice(1, -1)}</em>
        }
        return <span key={`${key}-${i}-${j}`}>{sub}</span>
      })
    })
  }

  const formatTime = (date) => {
    try {
      return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className={p.wrapper} style={mode === 'compact' ? { height: '100%', borderRadius: 14 } : undefined}>

      {/* ── Header ── */}
      <div className={p.header}>
        <div className={p.headerLeft}>
          <div className={p.botAvatar}>🤖</div>
          <div>
            <div className={p.botName}>RHConnect</div>
            <div className={p.botSub}>
              {mode === 'compact' ? 'Assistant RH' : 'Propulsé par Gemini AI · ArabSoft'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Bouton nouvelle conversation */}
          <button
            onClick={resetConversation}
            title="Nouvelle conversation"
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              borderRadius: 8,
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            🆕
          </button>

          {/* Bouton expand (compact uniquement) */}
          {mode === 'compact' && onExpand && (
            <button
              onClick={onExpand}
              title="Voir en grand"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ⛶
            </button>
          )}

          {/* Bouton fermer (compact uniquement) */}
          {mode === 'compact' && onClose && (
            <button
              onClick={onClose}
              title="Fermer"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white',
                borderRadius: 8,
                padding: '4px 8px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}

          {/* Badge en ligne (full uniquement) */}
          {mode === 'full' && (
            <div className={p.onlineBadge}>
              <span className={p.onlineDot} />
              EN LIGNE
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className={p.messagesArea}>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? p.rowUser : p.rowBot}>

            {msg.role === 'bot' && (
              <div className={p.msgAvatar}>
                {i === 0 ? '🤖' : '⚡'}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '78%', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className={`${p.bubble} ${msg.role === 'user' ? p.bubbleUser : p.bubbleBot} ${msg.error ? p.bubbleError : ''}`} style={{ maxWidth: '100%' }}>
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>
                    {formatLine(line, `m${i}-l${j}`)}
                    {j < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>

              {/* Actions bot : copier */}
              {msg.role === 'bot' && i > 0 && !msg.error && (
                <button
                  onClick={() => copyText(msg.text)}
                  title="Copier"
                  style={{
                    marginTop: 4,
                    fontSize: 10,
                    color: 'var(--text3)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                  }}
                >
                  📋 Copier
                </button>
              )}
            </div>

            {msg.role === 'user' && (
              <div className={p.userAvatar}>
                {user?.prenom?.[0]?.toUpperCase()}{user?.nom?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className={p.rowBot}>
            <div className={p.msgAvatar}>💬</div>
            <div className={`${p.bubble} ${p.bubbleBot}`} style={{ padding: '14px 18px' }}>
              <span className={p.typing}>
                <span className={p.dot} />
                <span className={p.dot} style={{ animationDelay: '0.2s' }} />
                <span className={p.dot} style={{ animationDelay: '0.4s' }} />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Shortcuts ── */}
      <div className={p.shortcuts}>
        {activeShortcuts.slice(0, mode === 'compact' ? 3 : 6).map((sc, i) => (
          <button
            key={i}
            className={p.shortcutBtn}
            onClick={() => sendMessage(sc.text)}
            disabled={loading}
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* ── Saisie ── */}
      <div className={p.inputArea}>
        <textarea
          className={p.textarea}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={loading ? 'Réponse en cours…' : 'Posez votre question RH... (Entrée pour envoyer)'}
          rows={1}
          disabled={loading}
        />
        <button
          className={p.sendBtn}
          style={{ opacity: (!input.trim() || loading) ? 0.5 : 1 }}
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          ➤
        </button>
      </div>

      {mode === 'full' && (
        <div className={p.hint}>Portail RH ArabSoft · Assistant Gemini AI</div>
      )}
    </div>
  )
}

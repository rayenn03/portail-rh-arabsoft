import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const QUICK_REPLIES = [
  'Mon solde de congés',
  'Soumettre une demande',
  'Attestation de travail',
  'Politique de prêts',
]

export default function ChatbotWidget() {
  const { user } = useAuth()
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Bonjour ${user?.prenom} ! 👋\nJe suis votre assistant RH. Comment puis-je vous aider ?` }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread]   = useState(false)
  const bottomRef = useRef(null)

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Envoyer un message
  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chatbot', { message: msg })
      const reply = res.data.reply || res.data.response || 'Erreur de réponse.'
      setMessages(prev => [...prev, { role: 'bot', text: reply }])
      if (!open) setUnread(true)
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Désolé, problème technique. Réessayez.', error: true }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const toggle = () => {
    setOpen(prev => !prev)
    setUnread(false)
  }

  return (
    <>
      {/* ── Animations CSS ── */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
      `}</style>

      {/* ── Boite de chat ── */}
      {open && (
        <div style={s.chatBox}>

          {/* Header */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.headerAvatar}>🤖</div>
              <div>
                <div style={s.headerName}>Assistant RH</div>
                <div style={s.headerSub}>Gemini AI · En ligne</div>
              </div>
            </div>
            <button onClick={toggle} style={s.closeBtn}>✕</button>
          </div>

          {/* Messages */}
          <div style={s.messagesArea}>
            {messages.map((msg, i) => (
              <div key={i} style={{...(msg.role === 'user' ? s.rowUser : s.rowBot), animation:'fadeIn 0.2s ease-out'}}>
                {msg.role === 'bot' && <div style={s.botDot}>{i === 0 ? '🤖' : '⚡'}</div>}
                <div style={{
                  ...s.bubble,
                  ...(msg.role === 'user' ? s.bubbleUser : s.bubbleBot),
                  ...(msg.error ? s.bubbleError : {}),
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={s.rowBot}>
                <div style={s.botDot}>💬</div>
                <div style={{ ...s.bubble, ...s.bubbleBot, padding: '10px 16px' }}>
                  <span style={s.typing}>
                    <span style={s.dot} />
                    <span style={{ ...s.dot, animationDelay: '0.15s' }} />
                    <span style={{ ...s.dot, animationDelay: '0.3s' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies (seulement si 1 message = le message d'accueil) */}
          {messages.length === 1 && (
            <div style={s.quickReplies}>
              {QUICK_REPLIES.map((q, i) => (
                <button key={i} className="qr-btn" style={s.qrBtn} onClick={() => send(q)} disabled={loading}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={s.inputArea}>
            <input
              className="input-glass"
              style={s.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Votre question..."
              disabled={loading}
            />
            <button
              style={{ ...s.sendBtn, opacity: (!input.trim() || loading) ? 0.5 : 1 }}
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* ── Bouton FAB ── */}
      <button onClick={toggle} className="fab-hover" style={s.fab}>
        <span style={{ fontSize: '24px' }}>{open ? '✕' : '🤖'}</span>
        {unread && !open && <span style={s.badge} />}
      </button>
    </>
  )
}

// ── STYLES ──────────────────────────────────────────────────────────────────────
const s = {
  // FAB — bouton rond fixe en bas à droite
  fab: {
    position: 'fixed', bottom: '24px', left: '24px', zIndex: 10000,
    width: '56px', height: '56px', borderRadius: '50%',
    background: 'var(--accent)', border: 'none', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,45,32,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.2s',
  },
  badge: {
    position: 'absolute', top: '-2px', right: '-2px',
    width: '14px', height: '14px', borderRadius: '50%',
    background: '#22C55E', border: '2px solid white',
    animation: 'pulse 1.5s infinite',
  },

  // Boite de chat
  chatBox: {
    position: 'fixed', bottom: '90px', left: '24px', zIndex: 10000,
    width: '360px', height: '520px',
    background: 'var(--bg2)', borderRadius: '16px',
    boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
    border: '1px solid var(--border)',
    backdropFilter: 'blur(20px)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    animation: 'slideUp 0.25s ease-out',
  },

  // Header
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  headerAvatar: {
    width: '34px', height: '34px', borderRadius: '8px',
    background: 'var(--border2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
  },
  headerName: { fontSize: '14px', fontWeight: 600, color: 'var(--text)' },
  headerSub:  { fontSize: '10px', color: 'var(--text2)', marginTop: '1px' },
  closeBtn: {
    width: '28px', height: '28px', borderRadius: '6px',
    background: 'var(--border)', border: 'none',
    color: 'var(--text2)', cursor: 'pointer',
    fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },

  // Messages
  messagesArea: {
    flex: 1, overflowY: 'auto', padding: '14px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    background: 'var(--bg)',
  },
  rowBot:  { display: 'flex', alignItems: 'flex-start', gap: '8px' },
  rowUser: { display: 'flex', justifyContent: 'flex-end' },
  botDot: {
    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
    background: 'var(--surface)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
  },
  bubble: {
    maxWidth: '78%', padding: '10px 14px',
    borderRadius: '12px', fontSize: '13px', lineHeight: 1.5,
    fontFamily: 'Inter, sans-serif', whiteSpace: 'pre-wrap',
  },
  bubbleBot: {
    background: 'var(--surface)', color: 'var(--text)',
    border: '1px solid var(--border)', borderTopLeftRadius: '2px',
  },
  bubbleUser: {
    background: 'var(--accent)', color: 'white',
    borderTopRightRadius: '2px',
  },
  bubbleError: {
    background: 'rgba(255,45,32,0.10)', color: '#FF6B63',
    border: '1px solid rgba(255,45,32,0.25)',
  },

  // Typing dots
  typing: { display: 'flex', gap: '4px', alignItems: 'center' },
  dot: {
    width: '6px', height: '6px', borderRadius: '50%',
    background: 'var(--text3)',
    animation: 'bounce 1.2s infinite',
    display: 'inline-block',
  },

  // Quick replies
  quickReplies: {
    display: 'flex', flexWrap: 'wrap', gap: '6px',
    padding: '8px 14px', borderTop: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  qrBtn: {
    padding: '5px 10px', borderRadius: '16px', fontSize: '11px',
    fontWeight: 500, cursor: 'pointer',
    border: '1px solid var(--border2)', background: 'var(--border)',
    color: 'var(--text)', fontFamily: 'Inter, sans-serif',
  },

  // Input
  inputArea: {
    display: 'flex', gap: '8px', padding: '10px 14px',
    borderTop: '1px solid var(--border)', background: 'var(--surface)',
  },
  input: {
    flex: 1, padding: '8px 12px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--surface)',
    fontSize: '13px',
    fontFamily: 'Inter, sans-serif', color: 'var(--text)', outline: 'none',
  },
  sendBtn: {
    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
    background: 'var(--accent)', border: 'none', color: 'white',
    fontSize: '14px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}

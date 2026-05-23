import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../api/axios'
import p from './Messages.module.css'

export default function Messages() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [conversations, setConversations] = useState([])
  const [contacts, setContacts]           = useState([])
  const [activeContact, setActiveContact] = useState(null)
  const [messages, setMessages]           = useState([])
  const [input, setInput]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [newChatOpen, setNewChatOpen]     = useState(false)
  const [search, setSearch]               = useState('')
  const bottomRef = useRef(null)

  // ── Data fetching ──────────────────────────────────────────────────
  const fetchConversations = (silent = false) => {
    api.get('/messages')
      .then(res => setConversations(res.data))
      .catch(() => { if (!silent) setConversations([]) })
  }

  const fetchContacts = () => {
    api.get('/messages/contacts')
      .then(res => setContacts(res.data))
      .catch(() => setContacts([]))
  }

  const fetchConversation = (contactId) => {
    api.get(`/messages/conversation/${contactId}`)
      .then(res => {
        setMessages(res.data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .catch(() => setMessages([]))
  }

  useEffect(() => {
    fetchConversations()
    fetchContacts()
    // Filet de sécurité — le live est géré par WebSocket Reverb
    const interval = setInterval(() => fetchConversations(true), 60000)
    return () => clearInterval(interval)
  }, [])

  // Ouvrir une conversation
  const openConversation = (contact) => {
    setActiveContact(contact)
    fetchConversation(contact.id)
    setNewChatOpen(false)
  }

  // Envoyer un message
  const sendMessage = async () => {
    if (sending) return
    if (!activeContact) {
      showToast('Sélectionnez un contact avant d\'envoyer un message.', 'error')
      return
    }
    const text = input.trim()
    if (!text) {
      showToast('Le message ne peut pas être vide.', 'error')
      return
    }
    if (text.length > 2000) {
      showToast('Message trop long (max 2000 caractères).', 'error')
      return
    }
    setSending(true)
    try {
      const res = await api.post('/messages', {
        destinataire_id: activeContact.id,
        contenu:          text,
      })
      setMessages(prev => [...prev, res.data.data])
      setInput('')
      fetchConversations(true)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'envoi du message.', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Photo URL (backend renvoie soit une URL complète soit juste le chemin)
  const photoUrl = (u) => {
    if (!u?.photo) return null
    if (u.photo.startsWith('http')) return u.photo
    return `http://127.0.0.1:8000/storage/${u.photo}`
  }

  const initials = (u) => `${u?.prenom?.[0] || ''}${u?.nom?.[0] || ''}`.toUpperCase()

  // Formater heure
  const formatTime = (dt) => {
    if (!dt) return ''
    const d = new Date(dt)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    return isToday
      ? d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })
      : d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
  }

  // Filtrer contacts par recherche
  const filteredContacts = contacts.filter(c =>
    `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase())
  )

  const roleLabel = { admin:'Admin RH', chef:'Chef', employe:'Employé' }
  const roleColor = { admin:'#22C55E', chef:'#FF2D20', employe:'#3B82F6' }

  return (
    <Layout title="Messagerie">
      <div className={p.container}>

        {/* ── Colonne GAUCHE : Liste des conversations ── */}
        <div className={p.sidebar}>
          <div className={p.sidebarHeader}>
            <div className={p.sidebarTitle}>Conversations</div>
            <button className={p.newChatBtn} onClick={() => setNewChatOpen(true)}>
              ✏️ Nouveau
            </button>
          </div>

          <div className={p.convList}>
            {conversations.length === 0 ? (
              <div className={p.emptyState}>
                <div style={{fontSize:'32px',marginBottom:'8px'}}>💬</div>
                <div>Aucune conversation</div>
                <button className={p.newChatBtn} style={{marginTop:'12px'}} onClick={() => setNewChatOpen(true)}>
                  Démarrer une conversation
                </button>
              </div>
            ) : (
              conversations.map(conv => {
                const active = activeContact?.id === conv.contact.id
                return (
                  <div
                    key={conv.contact.id}
                    onClick={() => openConversation(conv.contact)}
                    className={`${p.convItem} ${active ? p.convItemActive : ''}`}
                  >
                    <div className={p.convAvatar}>
                      {photoUrl(conv.contact)
                        ? <img src={photoUrl(conv.contact)} alt="" className={p.avatarImg} />
                        : initials(conv.contact)}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div className={p.convTop}>
                        <div className={p.convName}>{conv.contact.prenom} {conv.contact.nom}</div>
                        <div className={p.convTime}>{formatTime(conv.dernier_message.created_at)}</div>
                      </div>
                      <div className={p.convBottom}>
                        <div className={p.convLast}>
                          {conv.dernier_message.expediteur_id === user?.id && '✓ '}
                          {conv.dernier_message.contenu}
                        </div>
                        {conv.non_lus > 0 && (
                          <div className={p.unreadBadge}>{conv.non_lus}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Colonne DROITE : Zone de chat ── */}
        <div className={p.chatArea}>
          {!activeContact ? (
            <div className={p.chatEmpty}>
              <div style={{fontSize:'72px',marginBottom:'16px'}}>💬</div>
              <div className={p.chatEmptyTitle}>Messagerie interne</div>
              <div className={p.chatEmptyText}>
                Sélectionnez une conversation ou démarrez-en une nouvelle
              </div>
            </div>
          ) : (
            <>
              {/* Header du chat */}
              <div className={p.chatHeader}>
                <div className={p.convAvatar}>
                  {photoUrl(activeContact)
                    ? <img src={photoUrl(activeContact)} alt="" className={p.avatarImg} />
                    : initials(activeContact)}
                </div>
                <div style={{flex:1}}>
                  <div className={p.chatHeaderName}>{activeContact.prenom} {activeContact.nom}</div>
                  <div className={p.chatHeaderRole} style={{ color: roleColor[activeContact.role] }}>
                    {roleLabel[activeContact.role] || activeContact.role}
                    {activeContact.departement && ` · ${activeContact.departement}`}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className={p.messagesArea}>
                {messages.length === 0 ? (
                  <div className={p.emptyState} style={{flex:1}}>
                    <div style={{fontSize:'48px',marginBottom:'8px'}}>👋</div>
                    <div>Dites bonjour à {activeContact.prenom} !</div>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const mine = msg.expediteur_id === user?.id
                    return (
                      <div key={msg.id || i} className={mine ? p.rowMine : p.rowOther}>
                        <div className={`${p.bubble} ${mine ? p.bubbleMine : p.bubbleOther}`}>
                          <div>{msg.contenu}</div>
                          <div className={p.bubbleTime} style={{ color: mine ? 'rgba(255,255,255,0.75)' : 'var(--text3)' }}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className={p.inputArea}>
                <input
                  className={p.input}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Écrivez un message..."
                  disabled={sending}
                />
                <button
                  className={p.sendBtn}
                  style={{ opacity: (!input.trim() || sending) ? 0.5 : 1 }}
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── Modal nouvelle conversation ── */}
        {newChatOpen && (
          <div className={p.modalOverlay} onClick={() => setNewChatOpen(false)}>
            <div className={p.modal} onClick={e => e.stopPropagation()}>
              <div className={p.modalHeader}>
                <div className={p.modalTitle}>Nouveau message</div>
                <button className={p.closeBtn} onClick={() => setNewChatOpen(false)}>✕</button>
              </div>
              <input
                className={p.searchInput}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Rechercher un contact..."
                autoFocus
              />
              <div className={p.contactsList}>
                {filteredContacts.length === 0 ? (
                  <div className={p.emptyState}>Aucun contact</div>
                ) : filteredContacts.map(c => (
                  <div key={c.id} className={p.contactItem} onClick={() => openConversation(c)}>
                    <div className={p.convAvatar}>
                      {photoUrl(c) ? <img src={photoUrl(c)} alt="" className={p.avatarImg} /> : initials(c)}
                    </div>
                    <div style={{flex:1}}>
                      <div className={p.convName}>{c.prenom} {c.nom}</div>
                      <div style={{ fontSize:'11px', color: roleColor[c.role] }}>
                        {roleLabel[c.role] || c.role}
                        {c.departement && ` · ${c.departement}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

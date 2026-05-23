import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import s from '../styles/shared.module.css'
import p from './PasswordResets.module.css'

export default function PasswordResets() {
  const { user } = useAuth()
  const [items, setItems]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [tab, setTab]                   = useState('all')
  const [selected, setSelected]         = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast]               = useState(null)
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const fetchData = () => {
    setLoading(true)
    api.get('/password-resets')
      .then(res => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const filtered = items.filter(d => {
    if (tab === 'all')      return true
    if (tab === 'pending')  return d.statut === 'en_attente'
    if (tab === 'approved') return d.statut === 'approuvee'
    if (tab === 'rejected') return d.statut === 'refusee'
    if (tab === 'used')     return d.statut === 'utilisee'
    return true
  })

  const handleAction = async (id, action) => {
    setActionLoading(true)
    try {
      await api.put(`/password-resets/${id}/${action}`)
      setSelected(null)
      fetchData()
      showToast(action === 'approve' ? 'Demande approuvée. Email envoyé.' : 'Demande refusée.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise à jour.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const statusCls = {
    en_attente: p.statusEnAttente,
    approuvee:  p.statusApprouvee,
    refusee:    p.statusRefusee,
    utilisee:   p.statusUtilisee,
  }

  return (
    <Layout title="Réinitialisations de mot de passe">

      {/* ── Header ── */}
      <div className={s.pageHeader}>
        <div>
          <h2 className={s.pageTitle}>Demandes de réinitialisation</h2>
          <p className={s.pageSub}>Validez ou refusez les demandes de mot de passe oublié</p>
        </div>
        <div className={p.countBadge}>
          {items.filter(d => d.statut === 'en_attente').length} en attente
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={s.tabs}>
        {[
          { key:'all',      label:'Toutes',     count: items.length },
          { key:'pending',  label:'En attente', count: items.filter(d => d.statut === 'en_attente').length },
          { key:'approved', label:'Approuvées', count: items.filter(d => d.statut === 'approuvee').length },
          { key:'rejected', label:'Refusées',   count: items.filter(d => d.statut === 'refusee').length },
          { key:'used',     label:'Utilisées',  count: items.filter(d => d.statut === 'utilisee').length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`${s.tab} ${tab === t.key ? s.tabActive : ''}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`${p.tabCount} ${tab === t.key ? p.tabCountActive : ''}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className={s.tableWrap}>
        {loading ? (
          <div className={s.loader}>⏳ Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>🔑</div>
            <div style={{fontWeight:500,color:'var(--text)'}}>Aucune demande trouvée</div>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                {['Employé','Email','Date demande','Expire le','Statut','Actions'].map(h => (
                  <th key={h} className={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={i}
                  className="table-row"
                  style={{borderBottom:'1px solid var(--border)', cursor:'pointer'}}
                  onClick={() => setSelected(d)}
                >
                  {/* Employé */}
                  <td className={s.td}>
                    <div className={p.empCell}>
                      <div className={p.empAvatar}>
                        {d.user?.prenom?.[0]}{d.user?.nom?.[0]}
                      </div>
                      <div>
                        <div className={p.empName}>
                          {d.user?.prenom} {d.user?.nom}
                        </div>
                        <div className={p.empDept}>
                          {d.user?.departement || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className={s.td}>
                    <div className={p.cellText}>{d.email}</div>
                  </td>

                  {/* Date demande */}
                  <td className={s.td}>
                    <div className={p.cellTextMuted}>
                      {new Date(d.created_at).toLocaleString('fr-FR')}
                    </div>
                  </td>

                  {/* Expire le */}
                  <td className={s.td}>
                    <div className={p.cellTextMuted}>
                      {d.expires_at ? new Date(d.expires_at).toLocaleString('fr-FR') : '—'}
                    </div>
                  </td>

                  {/* Statut */}
                  <td className={s.td}>
                    <span className={`${p.statusBadge} ${statusCls[d.statut] || ''}`}>
                      {statusLabel[d.statut] || d.statut}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className={s.td} onClick={e => e.stopPropagation()}>
                    <button onClick={() => setSelected(d)} className={p.btnView}>
                      👁 Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast-enter" style={{position:'fixed',bottom:'24px',right:'24px',zIndex:9999,background:toast.type==='error'?'rgba(255,45,32,0.15)':'rgba(34,197,94,0.15)',border:`1px solid ${toast.type==='error'?'rgba(255,45,32,0.35)':'rgba(34,197,94,0.35)'}`,color:toast.type==='error'?'#FF6B63':'#22C55E',padding:'12px 20px',borderRadius:'10px',fontSize:'13px',fontWeight:500,backdropFilter:'blur(20px)',boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
          {toast.type==='error'?'⚠️':'✅'} {toast.msg}
        </div>
      )}

      {/* Modale détails */}
      {selected && (
        <div className={p.overlay} onClick={() => setSelected(null)}>
          <div className={`modal-enter ${p.modal}`} onClick={e => e.stopPropagation()}>

            <div className={p.modalHeader}>
              <div>
                <span className={`${p.statusBadge} ${statusCls[selected.statut] || ''}`}>
                  {statusLabel[selected.statut] || selected.statut}
                </span>
                <h3 className={p.modalTitle}>Demande de réinitialisation #{selected.id}</h3>
              </div>
              <button onClick={() => setSelected(null)} className={p.btnClose}>✕</button>
            </div>

            <div className={p.modalBody}>

              <div className={p.section}>
                <div className={p.sectionTitle}>👤 Utilisateur</div>
                <div className={p.infoGrid}>
                  <InfoRow label="Nom complet" value={`${selected.user?.prenom || ''} ${selected.user?.nom || ''}`} />
                  <InfoRow label="Email"       value={selected.email} />
                  <InfoRow label="Département" value={selected.user?.departement || '—'} />
                  <InfoRow label="Poste"       value={selected.user?.poste || '—'} />
                  <InfoRow label="Téléphone"   value={selected.user?.telephone || '—'} />
                  <InfoRow label="Rôle"        value={selected.user?.role || '—'} />
                </div>
              </div>

              <div className={p.section}>
                <div className={p.sectionTitle}>📋 Détails de la demande</div>
                <div className={p.infoGrid}>
                  <InfoRow label="Statut"      value={statusLabel[selected.statut] || selected.statut} />
                  <InfoRow label="Soumise le"  value={new Date(selected.created_at).toLocaleString('fr-FR')} />
                  {selected.expires_at && (
                    <InfoRow label="Expire le" value={new Date(selected.expires_at).toLocaleString('fr-FR')} />
                  )}
                </div>
              </div>

              {/* Action zone */}
              {selected.statut === 'en_attente' && user?.role === 'admin' && (
                <div className={p.section}>
                  <div className={p.sectionTitle}>✏️ Votre décision</div>
                  <div className={p.decisionNote}>
                    En approuvant, un email contenant un lien sécurisé (valable 15 minutes) sera envoyé à <strong style={{color:'var(--accent)'}}>{selected.email}</strong>.
                  </div>
                  <div className={p.actionBtns}>
                    <button
                      onClick={() => handleAction(selected.id, 'approve')}
                      className={`btn-hover ${p.btnApprove}`}
                      disabled={actionLoading}
                    >
                      ✓ Approuver et envoyer l'email
                    </button>
                    <button
                      onClick={() => handleAction(selected.id, 'reject')}
                      className={`btn-hover ${p.btnReject}`}
                      disabled={actionLoading}
                    >
                      ✗ Refuser
                    </button>
                  </div>
                </div>
              )}

              {selected.statut !== 'en_attente' && (
                <div className={selected.statut === 'refusee' ? p.commentBoxRed : p.commentBoxGreen}>
                  <div className={p.commentLabel}>Statut</div>
                  <div className={p.commentText}>
                    {selected.statut === 'approuvee' && '✅ Demande approuvée — l\'email a été envoyé.'}
                    {selected.statut === 'refusee'   && '❌ Demande refusée par l\'administrateur.'}
                    {selected.statut === 'utilisee'  && '🔒 Lien utilisé — le mot de passe a été réinitialisé.'}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </Layout>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
      <span className={p.infoRowLabel}>{label}</span>
      <span className={p.infoRowValue}>{value}</span>
    </div>
  )
}

const statusLabel = {
  en_attente: 'En attente',
  approuvee:  'Approuvée',
  refusee:    'Refusée',
  utilisee:   'Utilisée',
}

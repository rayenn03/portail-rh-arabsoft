import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import api from '../api/axios'
import s from '../styles/shared.module.css'
import p from './AllDemandes.module.css'
import { TYPE_LABEL, STATUT_LABEL, TYPE_CSS, STATUT_CSS } from '../constants/demandes'

export default function AllDemandes() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [demandes, setDemandes]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [tab, setTab]                     = useState('all')
  const [selectedDemande, setSelected]    = useState(null)   // demande sélectionnée pour la modale
  const [commentaire, setCommentaire]     = useState('')     // commentaire lors d'une action
  const [actionLoading, setActionLoading] = useState(false)

  // Rechargement intelligent : loading=true uniquement au premier chargement,
  // les refresh après action gardent l'ancienne liste visible (pas de flicker)
  const fetchDemandes = (silent = false) => {
    if (!silent) setLoading(true)
    api.get('/demandes?page=1')
      .then(res => setDemandes(res.data.data))
      .catch(() => { if (!silent) setDemandes([]) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDemandes() }, [])

  // Filtrer par onglet
  const filtered = demandes.filter(d => {
    if (tab === 'all')      return true
    if (tab === 'pending')  return d.statut === 'en_attente'
    if (tab === 'approved') return d.statut === 'approuvee' || d.statut === 'approuvee_direct'
    if (tab === 'rejected') return d.statut === 'refusee'
    if (tab === 'chef')     return d.statut === 'valide_chef'
    return true
  })

  // Vérifier si l'utilisateur peut agir sur cette demande
  const canAct = (d) => {
    if (user?.role === 'admin') {
      return d.statut === 'en_attente' || d.statut === 'valide_chef'
    }
    if (user?.role === 'chef') {
      return d.statut === 'en_attente' &&
        (d.type === 'conge' || d.type === 'autorisation')
    }
    return false
  }

  // Approuver ou refuser depuis la modale
  const handleAction = async (id, action) => {
    // ✅ Validation : commentaire obligatoire pour un refus, max 500 chars dans tous les cas
    if (action === 'refuser' && !commentaire.trim()) {
      showToast('Un commentaire est obligatoire pour refuser une demande.', 'error')
      return
    }
    if (commentaire.length > 500) {
      showToast('Le commentaire ne doit pas dépasser 500 caractères.', 'error')
      return
    }
    // ✅ Confirmation explicite avant validation
    const ok = await confirm({
      title: action === 'approuver' ? 'Approuver la demande' : 'Refuser la demande',
      message: action === 'approuver'
        ? 'Confirmer l\'approbation de cette demande ?'
        : 'Confirmer le refus de cette demande ?',
      confirmText: action === 'approuver' ? 'Approuver' : 'Refuser',
      danger: action === 'refuser',
    })
    if (!ok) return

    setActionLoading(true)
    try {
      let statut
      if (action === 'approuver') {
        statut = user?.role === 'chef' ? 'valide_chef' : 'approuvee'
      } else {
        statut = 'refusee'
      }

      // Champ commentaire selon le rôle
      const payload = { statut }
      if (user?.role === 'chef' && commentaire)  payload.commentaire_chef  = commentaire
      if (user?.role === 'admin' && commentaire) payload.commentaire_admin = commentaire

      await api.put(`/demandes/${id}`, payload)
      setSelected(null)
      setCommentaire('')
      fetchDemandes(true)  // Silent refresh — pas de flicker
      showToast('Décision enregistrée avec succès.')
    } catch {
      showToast('Erreur lors de la mise à jour.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // Fermer la modale
  const closeModal = () => {
    setSelected(null)
    setCommentaire('')
  }

  return (
    <Layout title="Toutes les Demandes">

      {/* ── Header ── */}
      <div className={s.pageHeader}>
        <div>
          <h2 className={s.pageTitle}>Toutes les Demandes</h2>
          <p className={s.pageSub}>Traitement et validation des demandes du personnel</p>
        </div>
        <div className={p.countBadge}>
          {demandes.filter(d => d.statut === 'en_attente').length} en attente
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={s.tabs}>
        {[
          { key:'all',      label:'Toutes',        count: demandes.length },
          { key:'pending',  label:'En attente',     count: demandes.filter(d=>d.statut==='en_attente').length },
          ...(user?.role === 'admin' ? [
            { key:'chef', label:'Validées chef',    count: demandes.filter(d=>d.statut==='valide_chef').length },
          ] : [
            { key:'chef', label:'En attente admin', count: demandes.filter(d=>d.statut==='valide_chef').length },
          ]),
          { key:'approved', label:'Approuvées',     count: demandes.filter(d=>d.statut==='approuvee'||d.statut==='approuvee_direct').length },
          { key:'rejected', label:'Rejetées',       count: demandes.filter(d=>d.statut==='refusee').length },
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
            <div style={{fontSize:'40px',marginBottom:'12px'}}>📭</div>
            <div style={{fontWeight:500,color:'var(--text)'}}>Aucune demande trouvée</div>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                {['Employé','Type','Détails','Date','Statut','Actions'].map(h => (
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
                        {d.employee?.prenom?.[0]}{d.employee?.nom?.[0]}
                      </div>
                      <div>
                        <div style={{fontSize:'13px',fontWeight:500,color:'var(--text)'}}>
                          {d.employee?.prenom} {d.employee?.nom}
                        </div>
                        <div style={{fontSize:'11px',color:'var(--text2)'}}>
                          {d.employee?.departement || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className={s.td}>
                    <span className={`${s.typeBadge} ${s[TYPE_CSS[d.type]] || s.badgeDefault}`}>
                      {TYPE_LABEL[d.type] || d.type}
                    </span>
                  </td>

                  {/* Détails */}
                  <td className={s.td}>
                    <div style={{fontSize:'13px',color:'var(--text)'}}>
                      {d.motif || d.type_document || '—'}
                    </div>
                    {d.date_debut && (
                      <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'2px'}}>
                        {new Date(d.date_debut).toLocaleDateString('fr-FR')}
                        {d.date_fin && ` → ${new Date(d.date_fin).toLocaleDateString('fr-FR')}`}
                      </div>
                    )}
                    {d.montant && (
                      <div style={{fontSize:'11px',color:'var(--text2)',marginTop:'2px'}}>
                        💰 {d.montant} DT {d.duree && `· ${d.duree}`}
                      </div>
                    )}
                  </td>

                  {/* Date */}
                  <td className={s.td}>
                    <div style={{fontSize:'13px',color:'var(--text2)'}}>
                      {new Date(d.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>

                  {/* Statut */}
                  <td className={s.td}>
                    <span className={`${s.statusBadge} ${s[STATUT_CSS[d.statut]] || ''}`}>
                      {STATUT_LABEL[d.statut] || d.statut}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className={s.td} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setSelected(d)}
                      className={p.btnView}
                    >
                      👁 Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast géré par <ToastProvider> global */}

      {selectedDemande && (
        <div className={s.overlay} onClick={closeModal}>
          <div className={`modal-enter ${p.modalWide}`} onClick={e => e.stopPropagation()}>

            {/* En-tête modale */}
            <div className={p.modalHeader}>
              <div>
                <span className={`${s.typeBadge} ${s[TYPE_CSS[selectedDemande.type]] || s.badgeDefault}`} style={{fontSize:'12px'}}>
                  {TYPE_LABEL[selectedDemande.type] || selectedDemande.type}
                </span>
                <h3 className={s.modalTitle} style={{marginTop:'6px',marginBottom:0}}>Détails de la Demande #{selectedDemande.id}</h3>
              </div>
              <button onClick={closeModal} className={p.btnClose}>✕</button>
            </div>

            <div className={p.modalBody}>

              {/* Infos employé */}
              <div className={p.section}>
                <div className={p.sectionTitle}>👤 Employé</div>
                <div className={p.infoGrid}>
                  <InfoRow label="Nom complet"   value={`${selectedDemande.employee?.prenom} ${selectedDemande.employee?.nom}`} />
                  <InfoRow label="Département"   value={selectedDemande.employee?.departement || '—'} />
                  <InfoRow label="Poste"         value={selectedDemande.employee?.poste || '—'} />
                  <InfoRow label="Email"         value={selectedDemande.employee?.email || '—'} />
                </div>
              </div>

              {/* Détails demande */}
              <div className={p.section}>
                <div className={p.sectionTitle}>📋 Détails de la demande</div>
                <div className={p.infoGrid}>
                  <InfoRow label="Type"          value={TYPE_LABEL[selectedDemande.type] || selectedDemande.type} />
                  <InfoRow label="Statut"        value={STATUT_LABEL[selectedDemande.statut] || selectedDemande.statut} />
                  <InfoRow label="Soumise le"    value={new Date(selectedDemande.created_at).toLocaleDateString('fr-FR')} />
                  {selectedDemande.motif        && <InfoRow label="Motif"           value={selectedDemande.motif} />}
                  {selectedDemande.type_document && <InfoRow label="Type document"   value={selectedDemande.type_document} />}
                  {selectedDemande.date_debut   && <InfoRow label="Date début"       value={new Date(selectedDemande.date_debut).toLocaleDateString('fr-FR')} />}
                  {selectedDemande.date_fin     && <InfoRow label="Date fin"         value={new Date(selectedDemande.date_fin).toLocaleDateString('fr-FR')} />}
                  {selectedDemande.montant      && <InfoRow label="Montant"          value={`${selectedDemande.montant} DT`} />}
                  {selectedDemande.duree        && <InfoRow label="Durée"            value={`${selectedDemande.duree} mois`} />}
                </div>
              </div>

              {/* Justificatif (pièce jointe) */}
              {selectedDemande.piece_jointe_url && (
                <div className={p.section}>
                  <div className={p.sectionTitle}>📎 Justificatif</div>
                  <a
                    href={selectedDemande.piece_jointe_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`btn-hover ${s.justifLink}`}
                  >
                    📎 Voir le justificatif
                  </a>
                </div>
              )}

              {/* Commentaires existants */}
              {(selectedDemande.commentaire_chef || selectedDemande.commentaire_admin) && (
                <div className={p.section}>
                  <div className={p.sectionTitle}>💬 Commentaires</div>
                  {selectedDemande.commentaire_chef && (
                    <div className={p.commentBox}>
                      <div className={p.commentLabel}>Chef hiérarchique</div>
                      <div className={p.commentText}>{selectedDemande.commentaire_chef}</div>
                    </div>
                  )}
                  {selectedDemande.commentaire_admin && (
                    <div className={`${p.commentBox} ${p.commentBoxAdmin}`}>
                      <div className={p.commentLabel}>Administrateur RH</div>
                      <div className={p.commentText}>{selectedDemande.commentaire_admin}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Zone action (si autorisé) */}
              {canAct(selectedDemande) && (
                <div className={p.section}>
                  <div className={p.sectionTitle}>✏️ Votre décision</div>
                  <textarea
                    className={`input-glass ${p.commentInput}`}
                    placeholder="Commentaire (optionnel) — visible par l'employé"
                    value={commentaire}
                    onChange={e => setCommentaire(e.target.value)}
                    rows={3}
                  />
                  <div className={p.actionBtns}>
                    <button
                      onClick={() => handleAction(selectedDemande.id, 'approuver')}
                      className={`btn-hover ${p.btnApprove}`}
                      disabled={actionLoading}
                    >
                      ✓ {user?.role === 'chef' ? 'Valider pour admin' : 'Approuver définitivement'}
                    </button>
                    <button
                      onClick={() => handleAction(selectedDemande.id, 'refuser')}
                      className={`btn-hover ${p.btnReject}`}
                      disabled={actionLoading}
                    >
                      ✗ Refuser
                    </button>
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

// Composant ligne d'info réutilisable
function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
      <span style={{ fontSize:'11px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>{label}</span>
      <span style={{ fontSize:'13px', color:'var(--text)', fontWeight:500 }}>{value}</span>
    </div>
  )
}

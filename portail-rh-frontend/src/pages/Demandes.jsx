import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import api from '../api/axios'
import s from '../styles/shared.module.css'
import { TYPE_LABEL, STATUT_LABEL, TYPE_CSS, STATUT_CSS } from '../constants/demandes'

export default function Demandes() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [demandes, setDemandes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab]             = useState('all')
  const [success, setSuccess]     = useState(false)
  const [detailModal, setDetailModal] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState(null)
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Date du jour au format YYYY-MM-DD pour bloquer les dates passées dans les inputs
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm]           = useState({
    type: '', date_debut: '', date_fin: '',
    montant: '', duree: '', motif: '',
    type_document: '', commentaire: '',
  })

  // ── Justificatif (pièce jointe) ────────────────────────────────────────────
  const [justifFile, setJustifFile] = useState(null)

  // Détermine si un justificatif est obligatoire selon le type + sous-type
  const isJustifRequired = () => {
    if (form.type === 'situation') return true
    if (form.type === 'conge' && ['Congé maladie', 'Congé exceptionnel'].includes(form.motif)) return true
    if (form.type === 'pret' && form.motif === 'Prêt personnel') return true
    return false
  }

  // Charger les demandes (silent=true → refresh sans flicker)
  const fetchDemandes = (silent = false) => {
    if (!silent) setLoading(true)
    api.get('/demandes?page=1')
      .then(res => setDemandes(res.data.data))
      .catch(() => { if (!silent) setDemandes([]) })
      .finally(() => setLoading(false))
  }
  // Voir détails
const openDetail = (d) => {
  setSelectedDemande(d)
  setDetailModal(true)
}

// Ouvrir modification
const openEdit = (d) => {
  setEditId(d.id)
  setEditForm({
    type:        d.type,
    date_debut:  d.date_debut ? d.date_debut.slice(0,10) : '',
    date_fin:    d.date_fin   ? d.date_fin.slice(0,10)   : '',
    montant:     d.montant    || '',
    duree:       d.duree      || '',
    motif:       d.motif      || '',
    commentaire: d.commentaire || '',
  })
  setEditModal(true)
}

// Modifier demande
const handleEdit = async () => {
  // ✅ Validation côté client des dates
  if (editForm.type === 'conge' || editForm.type === 'autorisation') {
    if (!editForm.date_debut) {
      showToast('La date de début est obligatoire.', 'error'); return
    }
    if (editForm.date_debut < today) {
      showToast('La date de début ne peut pas être dans le passé.', 'error'); return
    }
  }
  if (editForm.type === 'conge') {
    if (!editForm.date_fin) {
      showToast('La date de fin est obligatoire pour un congé.', 'error'); return
    }
    if (editForm.date_fin < editForm.date_debut) {
      showToast('La date de fin doit être postérieure ou égale à la date de début.', 'error'); return
    }
  }
  try {
    await api.put(`/demandes/${editId}`, editForm)
    setEditModal(false)
    fetchDemandes(true)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  } catch (e) {
    const msg = e?.response?.data?.errors
      ? Object.values(e.response.data.errors).flat().join(' ')
      : (e?.response?.data?.message || 'Erreur lors de la modification.')
    showToast(msg, 'error')
  }
}

// Annuler demande
const handleCancel = async (id) => {
  const ok = await confirm({
    title: 'Annuler la demande',
    message: 'Voulez-vous vraiment annuler cette demande ? Cette action est irréversible.',
    confirmText: 'Oui, annuler',
    cancelText: 'Non',
    danger: true,
  })
  if (!ok) return
  try {
    await api.delete(`/demandes/${id}`)
    fetchDemandes(true)
    showToast('Demande annulée.')
  } catch (e) {
    showToast('Erreur lors de l\'annulation.', 'error')
  }
}

// Télécharger PDF officiel (document administratif approuvé uniquement)
const handleDownload = async (demande) => {
  try {
    const token = localStorage.getItem('token')
    const { default: axios } = await import('axios')
    const response = await axios.get(
      `http://127.0.0.1:8000/api/demandes/${demande.id}/telecharger`,
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
        responseType: 'blob',
      }
    )
    const blob     = new Blob([response.data], { type: 'application/pdf' })
    const url      = URL.createObjectURL(blob)
    const ref      = `REF-${demande.id}-${new Date().getFullYear()}`
    const slug     = (demande.motif || 'document').toLowerCase().replace(/\s+/g, '-')
    const filename = `ArabSoft-${slug}-${ref}.pdf`
    const link     = document.createElement('a')
    link.href      = url
    link.download  = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast('PDF téléchargé avec succès.')
  } catch (e) {
    showToast('Erreur lors du téléchargement du PDF.', 'error')
  }
}

  useEffect(() => { fetchDemandes() }, [])

  // Filtrer par tab
  const filtered = demandes.filter(d => {
    if (tab === 'all')       return true
    if (tab === 'pending')   return d.statut === 'en_attente'
    if (tab === 'approved')  return d.statut === 'approuvee'
    if (tab === 'rejected')  return d.statut === 'refusee'
    return true
  })

  // Soumettre une demande
  const handleSubmit = async () => {
    // ✅ Validation : type obligatoire (toast au lieu de bouton silencieusement désactivé)
    if (!form.type) {
      showToast('Veuillez sélectionner un type de demande.', 'error')
      return
    }
    if (form.type === 'document' && !form.motif) {
      showToast('Veuillez sélectionner le document souhaité.', 'error')
      return
    }
    if (form.type === 'autorisation' && !form.motif) {
      showToast('Veuillez préciser le motif de l\'autorisation.', 'error')
      return
    }
    if (form.type === 'pret') {
      if (!form.montant || Number(form.montant) <= 0) {
        showToast('Veuillez saisir un montant valide.', 'error')
        return
      }
    }
    // ✅ Validation côté client des dates
    if (form.type === 'conge' || form.type === 'autorisation') {
      if (!form.date_debut) {
        showToast('La date de début est obligatoire.', 'error')
        return
      }
      if (form.date_debut < today) {
        showToast('La date de début ne peut pas être dans le passé.', 'error')
        return
      }
    }
    if (form.type === 'conge') {
      if (!form.date_fin) {
        showToast('La date de fin est obligatoire pour un congé.', 'error')
        return
      }
      if (form.date_fin < form.date_debut) {
        showToast('La date de fin doit être postérieure ou égale à la date de début.', 'error')
        return
      }
    }
    // ✅ Validation côté client du justificatif
    if (isJustifRequired() && !justifFile) {
      showToast('Un justificatif est obligatoire pour ce type de demande.', 'error')
      return
    }
    if (justifFile && justifFile.size > 5 * 1024 * 1024) {
      showToast('Le justificatif ne doit pas dépasser 5 Mo.', 'error')
      return
    }
    if (justifFile) {
      const ok = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(justifFile.type)
      if (!ok) {
        showToast('Format invalide. PDF, JPG ou PNG uniquement.', 'error')
        return
      }
    }

    setSubmitting(true)
    try {
      // ✅ FormData pour envoyer le fichier en multipart
      const fd = new FormData()
      fd.append('type', form.type)
      if (form.date_debut) fd.append('date_debut', form.date_debut)
      if (form.date_fin)   fd.append('date_fin',   form.date_fin)
      if (form.montant)    fd.append('montant',    form.montant)
      if (form.duree)      fd.append('duree',      form.duree)
      fd.append('motif',       form.motif || form.type_document || '')
      fd.append('commentaire', form.commentaire || '')
      if (justifFile) fd.append('piece_jointe', justifFile)

      await api.post('/demandes', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setModalOpen(false)
      setSuccess(true)
      showToast('Demande soumise avec succès.', 'success')
      setForm({ type:'', date_debut:'', date_fin:'', montant:'', duree:'', motif:'', type_document:'', commentaire:'' })
      setJustifFile(null)
      fetchDemandes(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      const msg = e?.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' ')
        : (e?.response?.data?.message || 'Erreur lors de la soumission. Vérifiez les champs.')
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout title="Mes Demandes">

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h2 className={s.pageTitle}>Mes Demandes</h2>
          <p className={s.pageSub}>Gérez et suivez toutes vos demandes RH</p>
        </div>
              {user?.role === 'employe' && (
          <button onClick={() => setModalOpen(true)} className={s.btnNew}>
            + Nouvelle demande
          </button>
           )}
      </div>

      {/* Success alert */}
      {success && (
        <div className={s.successBox}>
          ✅ Votre demande a été soumise avec succès !
        </div>
      )}

      {/* Tabs */}
      <div className={s.tabs}>
        {[
          { key:'all',      label:'Toutes' },
          { key:'pending',  label:'En attente' },
          { key:'approved', label:'Approuvées' },
          { key:'rejected', label:'Rejetées' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`${s.tab} ${tab === t.key ? s.tabActive : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={s.tableWrap}>
        {loading ? (
          <div className={s.loader}>⏳ Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>📭</div>
            <div style={{fontWeight:500,marginBottom:'6px'}}>Aucune demande trouvée</div>
            <div style={{fontSize:'13px',color:'var(--text3)'}}>Cliquez sur "+ Nouvelle demande" pour commencer</div>
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                {['Type','Détails','Date soumission','Statut','Actions'].map(h => (
                  <th key={h} className={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={i} className={`table-row ${s.tr}`}>
                  <td className={s.td}>
                    <span className={`${s.typeBadge} ${s[TYPE_CSS[d.type]] || s.badgeDefault}`}>
                      {TYPE_LABEL[d.type] || d.type}
                    </span>
                  </td>
                  <td className={s.td}>{d.motif || '—'}</td>
                  <td className={s.td}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className={s.td}>
                    <span className={`${s.statusBadge} ${s[STATUT_CSS[d.statut]] || ''}`}>
                      {STATUT_LABEL[d.statut] || d.statut}
                    </span>
                  </td>
                  <td className={s.td}>
  <button
    onClick={() => openDetail(d)}
    className={`btn-hover ${s.actionBtn}`}
  >
    Détails
  </button>
  {d.statut === 'en_attente' && (
    <>
      <button
        onClick={() => openEdit(d)}
        className={`btn-hover ${s.actionBtn}`}
        style={{marginLeft:'4px'}}
      >
        ✏️
      </button>
      <button
        onClick={() => handleCancel(d.id)}
        className={`${s.actionBtn} ${s.actionBtnRed}`}
        style={{marginLeft:'4px'}}
      >Annuler
      </button>
    </>
  )}
</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Toast géré par <ToastProvider> global */}

      {modalOpen && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && (setModalOpen(false), setJustifFile(null))}>
          <div className={`modal-enter ${s.modal}`}>
            <div className={s.modalTitle}>Nouvelle Demande</div>

            {/* Type */}
            <div className={s.field}>
              <label className={s.label}>Type de demande *</label>
              <select
                className={s.input}
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
              >
                <option value="">-- Sélectionner --</option>
                <option value="conge">Demande de congé</option>
                <option value="pret">Prêt / Avance sur salaire</option>
                <option value="situation">Changement de situation personnelle</option>
                <option value="autorisation">Demande d'autorisation</option>
                <option value="document">Document administratif</option>
              </select>
            </div>

            {/* Champs dynamiques selon le type */}
            {form.type === 'conge' && (
              <div className={s.formGrid}>
                <div className={s.field}>
                  <label className={s.label}>Date de début *</label>
                  <input type="date" min={today} className={s.input} value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} />
                </div>
                <div className={s.field}>
                  <label className={s.label}>Date de fin *</label>
                  <input type="date" min={form.date_debut || today} className={s.input} value={form.date_fin} onChange={e => setForm({...form, date_fin: e.target.value})} />
                </div>
                <div className={s.field} style={{gridColumn:'1/-1'}}>
                  <label className={s.label}>Type de congé</label>
                  <select className={s.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})}>
                    <option value="">Congé annuel</option>
                    <option value="Congé maladie">Congé maladie</option>
                    <option value="Congé exceptionnel">Congé exceptionnel</option>
                    <option value="Congé sans solde">Congé sans solde</option>
                  </select>
                </div>
              </div>
            )}

            {form.type === 'pret' && (
              <div className={s.formGrid}>
                <div className={s.field}>
                  <label className={s.label}>Type</label>
                  <select className={s.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})}>
                    <option value="Prêt personnel">Prêt personnel</option>
                    <option value="Avance sur salaire">Avance sur salaire</option>
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Montant (DT) *</label>
                  <input type="number" placeholder="ex: 3000" className={s.input} value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} />
                </div>
                <div className={s.field} style={{gridColumn:'1/-1'}}>
                  <label className={s.label}>Durée de remboursement</label>
                  <select className={s.input} value={form.duree} onChange={e => setForm({...form, duree: e.target.value})}>
                    <option value="3 mois">3 mois</option>
                    <option value="6 mois">6 mois</option>
                    <option value="12 mois">12 mois</option>
                    <option value="24 mois">24 mois</option>
                  </select>
                </div>
              </div>
            )}

            {form.type === 'autorisation' && (
              <div className={s.formGrid}>
                <div className={s.field}>
                  <label className={s.label}>Date *</label>
                  <input type="date" min={today} className={s.input} value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} />
                </div>
                <div className={s.field}>
                  <label className={s.label}>Motif *</label>
                  <input type="text" placeholder="ex: Rendez-vous médical" className={s.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} />
                </div>
              </div>
            )}

            {form.type === 'document' && (
              <div className={s.field}>
                <label className={s.label}>Document souhaité *</label>
                <select className={s.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})}>
                  <option value="Attestation de travail">Attestation de travail</option>
                  <option value="Attestation de salaire">Attestation de salaire</option>
                  <option value="Bulletin de paie">Bulletin de paie</option>
                  <option value="Certificat de présence">Certificat de présence</option>
                </select>
              </div>
            )}

            {form.type === 'situation' && (
              <div className={s.field}>
                <label className={s.label}>Nature du changement *</label>
                <select className={s.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})}>
                  <option value="Changement d'adresse">Changement d'adresse</option>
                  <option value="Mariage">Mariage</option>
                  <option value="Naissance">Naissance</option>
                  <option value="Divorce">Divorce</option>
                </select>
              </div>
            )}

            {/* Justificatif — uniquement pour les types qui peuvent en avoir un */}
            {form.type && form.type !== 'document' && (
              <div className={s.field}>
                <label className={s.label}>
                  Justificatif {isJustifRequired() ? <span style={{color:'var(--accent)'}}>*</span> : <span style={{color:'var(--text3)'}}>(optionnel)</span>}
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={e => setJustifFile(e.target.files?.[0] || null)}
                  className={s.input}
                  style={{padding:'8px 10px', cursor:'pointer'}}
                />
                {justifFile && (
                  <div style={{fontSize:'12px', color:'var(--accent)', marginTop:'6px', fontWeight:500}}>
                    📎 {justifFile.name} · {(justifFile.size/1024).toFixed(0)} Ko
                  </div>
                )}
                <div style={{fontSize:'11px', color:'var(--text3)', marginTop:'4px'}}>
                  Formats acceptés : PDF, JPG, PNG · Max 5 Mo
                  {isJustifRequired() && ' · Obligatoire pour ce type de demande'}
                </div>
              </div>
            )}

            {/* Commentaire */}
            {form.type && (
              <div className={s.field}>
                <label className={s.label}>Commentaire (optionnel)</label>
                <textarea
                  rows={3}
                  placeholder="Informations complémentaires..."
                  className={s.input}
                  style={{resize:'vertical'}}
                  value={form.commentaire}
                  onChange={e => setForm({...form, commentaire: e.target.value})}
                />
              </div>
            )}

            {/* Actions */}
            <div className={s.modalActions}>
              <button onClick={() => { setModalOpen(false); setJustifFile(null) }} className={`btn-hover ${s.btnCancel}`} disabled={submitting}>Annuler</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`btn-hover ${s.btnSubmit}`}
              >
                {submitting ? 'Envoi…' : 'Soumettre la demande'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — Détails */}
{detailModal && selectedDemande && (
  <div className={s.overlay} onClick={e => e.target === e.currentTarget && setDetailModal(false)}>
    <div className={`modal-enter ${s.modal}`}>
      <div className={s.modalTitle}>Détails de la demande</div>

      <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
        {[
          ['Type',            TYPE_LABEL[selectedDemande.type] || selectedDemande.type],
          ['Statut',          STATUT_LABEL[selectedDemande.statut] || selectedDemande.statut],
          ['Motif / Détails', selectedDemande.motif || '—'],
          ['Date début',      selectedDemande.date_debut ? new Date(selectedDemande.date_debut).toLocaleDateString('fr-FR') : '—'],
          ['Date fin',        selectedDemande.date_fin   ? new Date(selectedDemande.date_fin).toLocaleDateString('fr-FR')   : '—'],
          ['Montant',         selectedDemande.montant    ? `${selectedDemande.montant} DT` : '—'],
          ['Durée',           selectedDemande.duree      || '—'],
          ['Commentaire',     selectedDemande.commentaire || '—'],
          ['Soumise le',      new Date(selectedDemande.created_at).toLocaleDateString('fr-FR')],
        ].map(([k, v]) => (
          <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)',fontSize:'14px'}}>
            <span style={{color:'var(--text2)',fontWeight:500}}>{k}</span>
            <span style={{color:'var(--text)',fontWeight:500,textAlign:'right',maxWidth:'280px'}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Lien justificatif */}
      {selectedDemande.piece_jointe_url && (
        <a
          href={selectedDemande.piece_jointe_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn-hover ${s.justifLink}`}
        >
          📎 Voir le justificatif
        </a>
      )}

      <div className={s.modalActions} style={{marginTop:'24px'}}>
        <button onClick={() => setDetailModal(false)} className={`btn-hover ${s.btnCancel}`}>Fermer</button>
        {selectedDemande.type === 'document' &&
         (selectedDemande.statut === 'approuvee' || selectedDemande.statut === 'approuvee_direct') && (
          <button
            onClick={() => handleDownload(selectedDemande)}
            className={`btn-hover ${s.btnDownload}`}
          >
            📄 Télécharger PDF
          </button>
        )}
        {selectedDemande.statut === 'en_attente' && (
          <button
            onClick={() => { setDetailModal(false); openEdit(selectedDemande) }}
            className={`btn-hover ${s.btnSubmit}`}
          >
            ✏️ Modifier
          </button>
        )}
      </div>
    </div>
  </div>
)}

{/* MODAL — Modifier demande */}
{editModal && (
  <div className={s.overlay} onClick={e => e.target === e.currentTarget && setEditModal(false)}>
    <div className={`modal-enter ${s.modal}`}>
      <div className={s.modalTitle}>Modifier la demande</div>

      {editForm.type === 'conge' && (
        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label}>Date de début</label>
            <input type="date" min={today} className={s.input} value={editForm.date_debut} onChange={e=>setEditForm({...editForm,date_debut:e.target.value})} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Date de fin</label>
            <input type="date" min={editForm.date_debut || today} className={s.input} value={editForm.date_fin} onChange={e=>setEditForm({...editForm,date_fin:e.target.value})} />
          </div>
          <div className={s.field} style={{gridColumn:'1/-1'}}>
            <label className={s.label}>Type de congé</label>
            <select className={s.input} value={editForm.motif} onChange={e=>setEditForm({...editForm,motif:e.target.value})}>
              <option value="Congé annuel">Congé annuel</option>
              <option value="Congé maladie">Congé maladie</option>
              <option value="Congé exceptionnel">Congé exceptionnel</option>
              <option value="Congé sans solde">Congé sans solde</option>
            </select>
          </div>
        </div>
      )}

      {editForm.type === 'pret' && (
        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label}>Montant (DT)</label>
            <input type="number" className={s.input} value={editForm.montant} onChange={e=>setEditForm({...editForm,montant:e.target.value})} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Durée</label>
            <select className={s.input} value={editForm.duree} onChange={e=>setEditForm({...editForm,duree:e.target.value})}>
              <option value="3 mois">3 mois</option>
              <option value="6 mois">6 mois</option>
              <option value="12 mois">12 mois</option>
              <option value="24 mois">24 mois</option>
            </select>
          </div>
        </div>
      )}

      {editForm.type === 'autorisation' && (
        <div className={s.formGrid}>
          <div className={s.field}>
            <label className={s.label}>Date</label>
            <input type="date" min={today} className={s.input} value={editForm.date_debut} onChange={e=>setEditForm({...editForm,date_debut:e.target.value})} />
          </div>
          <div className={s.field}>
            <label className={s.label}>Motif</label>
            <input type="text" className={s.input} value={editForm.motif} onChange={e=>setEditForm({...editForm,motif:e.target.value})} />
          </div>
        </div>
      )}

      {editForm.type === 'document' && (
        <div className={s.field}>
          <label className={s.label}>Document souhaité</label>
          <select className={s.input} value={editForm.motif} onChange={e=>setEditForm({...editForm,motif:e.target.value})}>
            <option value="Attestation de travail">Attestation de travail</option>
            <option value="Attestation de salaire">Attestation de salaire</option>
            <option value="Bulletin de paie">Bulletin de paie</option>
            <option value="Certificat de présence">Certificat de présence</option>
          </select>
        </div>
      )}

      {editForm.type === 'situation' && (
        <div className={s.field}>
          <label className={s.label}>Nature du changement</label>
          <select className={s.input} value={editForm.motif} onChange={e=>setEditForm({...editForm,motif:e.target.value})}>
            <option value="Changement d'adresse">Changement d'adresse</option>
            <option value="Mariage">Mariage</option>
            <option value="Naissance">Naissance</option>
            <option value="Divorce">Divorce</option>
          </select>
        </div>
      )}

      <div className={s.field} style={{marginTop:'16px'}}>
        <label className={s.label}>Commentaire</label>
        <textarea
          rows={3}
          className={s.input}
          style={{resize:'vertical'}}
          value={editForm.commentaire}
          onChange={e=>setEditForm({...editForm,commentaire:e.target.value})}
        />
      </div>

      <div className={s.modalActions}>
        <button onClick={() => setEditModal(false)} className={`btn-hover ${s.btnCancel}`}>Annuler</button>
        <button onClick={handleEdit} className={`btn-hover ${s.btnSubmit}`}>
          Enregistrer
        </button>
      </div>
    </div>
  </div>
)}
    </Layout>
  )
}

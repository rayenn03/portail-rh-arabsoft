import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Demandes() {
  const { user } = useAuth()
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
  const [form, setForm]           = useState({
    type: '', date_debut: '', date_fin: '',
    montant: '', duree: '', motif: '',
    type_document: '', commentaire: '',
  })

  // Charger les demandes
  const fetchDemandes = () => {
    setLoading(true)
    api.get('/demandes')
      .then(res => setDemandes(res.data))
      .catch(() => setDemandes([]))
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
  try {
    await api.put(`/demandes/${editId}`, editForm)
    setEditModal(false)
    fetchDemandes()
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  } catch (e) {
    alert('Erreur lors de la modification.')
  }
}

// Annuler demande
const handleCancel = async (id) => {
  if (!window.confirm('Voulez-vous vraiment annuler cette demande ?')) return
  try {
    await api.delete(`/demandes/${id}`)
    fetchDemandes()
  } catch (e) {
    alert('Erreur lors de l\'annulation.')
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
    try {
      await api.post('/demandes', {
        type:        form.type,
        date_debut:  form.date_debut  || null,
        date_fin:    form.date_fin    || null,
        montant:     form.montant     || null,
        duree:       form.duree       || null,
        motif:       form.motif       || form.type_document || '',
        commentaire: form.commentaire || '',
      })
      setModalOpen(false)
      setSuccess(true)
      setForm({ type:'', date_debut:'', date_fin:'', montant:'', duree:'', motif:'', type_document:'', commentaire:'' })
      fetchDemandes()
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) {
      alert('Erreur lors de la soumission. Vérifiez les champs.')
    }
  }

  return (
    <Layout title="Mes Demandes">

      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Mes Demandes</h2>
          <p style={styles.pageSub}>Gérez et suivez toutes vos demandes RH</p>
        </div>
              {user?.role === 'employe' && (
          <button onClick={() => setModalOpen(true)} style={styles.btnNew}>
            + Nouvelle demande
          </button>
           )}
      </div>

      {/* Success alert */}
      {success && (
        <div style={styles.successBox}>
          ✅ Votre demande a été soumise avec succès !
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key:'all',      label:'Toutes' },
          { key:'pending',  label:'En attente' },
          { key:'approved', label:'Approuvées' },
          { key:'rejected', label:'Rejetées' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{...styles.tab, ...(tab === t.key ? styles.tabActive : {})}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        {loading ? (
          <div style={styles.loader}>⏳ Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>📭</div>
            <div style={{fontWeight:500,marginBottom:'6px'}}>Aucune demande trouvée</div>
            <div style={{fontSize:'13px',color:'var(--text3)'}}>Cliquez sur "+ Nouvelle demande" pour commencer</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Type','Détails','Date soumission','Statut','Actions'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={{...styles.typeBadge, ...typeStyle[d.type] || typeStyle.default}}>
                      {typeLabel[d.type] || d.type}
                    </span>
                  </td>
                  <td style={styles.td}>{d.motif || '—'}</td>
                  <td style={styles.td}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                  <td style={styles.td}>
                    <span style={{...styles.statusBadge, ...statusStyle[d.statut]}}>
                      {statusLabel[d.statut] || d.statut}
                    </span>
                  </td>
                  <td style={styles.td}>
  <button
    onClick={() => openDetail(d)}
    style={styles.actionBtn}
  >
    Détails
  </button>
  {d.statut === 'en_attente' && (
    <>
      <button
        onClick={() => openEdit(d)}
        style={{...styles.actionBtn, marginLeft:'4px'}}
      >
        ✏️
      </button>
      <button
        onClick={() => handleCancel(d.id)}
        style={{...styles.actionBtn, ...styles.actionBtnRed, marginLeft:'4px'}}
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

      {/* MODAL */}
      {modalOpen && (
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Nouvelle Demande</div>

            {/* Type */}
            <div style={styles.field}>
              <label style={styles.label}>Type de demande *</label>
              <select
                style={styles.input}
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
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Date de début *</label>
                  <input type="date" style={styles.input} value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Date de fin *</label>
                  <input type="date" style={styles.input} value={form.date_fin} onChange={e => setForm({...form, date_fin: e.target.value})} />
                </div>
                <div style={{...styles.field, gridColumn:'1/-1'}}>
                  <label style={styles.label}>Type de congé</label>
                  <select style={styles.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})}>
                    <option value="">Congé annuel</option>
                    <option value="Congé maladie">Congé maladie</option>
                    <option value="Congé exceptionnel">Congé exceptionnel</option>
                    <option value="Congé sans solde">Congé sans solde</option>
                  </select>
                </div>
              </div>
            )}

            {form.type === 'pret' && (
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Type</label>
                  <select style={styles.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})}>
                    <option value="Prêt personnel">Prêt personnel</option>
                    <option value="Avance sur salaire">Avance sur salaire</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Montant (DT) *</label>
                  <input type="number" placeholder="ex: 3000" style={styles.input} value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} />
                </div>
                <div style={{...styles.field, gridColumn:'1/-1'}}>
                  <label style={styles.label}>Durée de remboursement</label>
                  <select style={styles.input} value={form.duree} onChange={e => setForm({...form, duree: e.target.value})}>
                    <option value="3 mois">3 mois</option>
                    <option value="6 mois">6 mois</option>
                    <option value="12 mois">12 mois</option>
                    <option value="24 mois">24 mois</option>
                  </select>
                </div>
              </div>
            )}

            {form.type === 'autorisation' && (
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Date *</label>
                  <input type="date" style={styles.input} value={form.date_debut} onChange={e => setForm({...form, date_debut: e.target.value})} />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Motif *</label>
                  <input type="text" placeholder="ex: Rendez-vous médical" style={styles.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})} />
                </div>
              </div>
            )}

            {form.type === 'document' && (
              <div style={styles.field}>
                <label style={styles.label}>Document souhaité *</label>
                <select style={styles.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})}>
                  <option value="Attestation de travail">Attestation de travail</option>
                  <option value="Attestation de salaire">Attestation de salaire</option>
                  <option value="Bulletin de paie">Bulletin de paie</option>
                  <option value="Certificat de présence">Certificat de présence</option>
                </select>
              </div>
            )}

            {form.type === 'situation' && (
              <div style={styles.field}>
                <label style={styles.label}>Nature du changement *</label>
                <select style={styles.input} value={form.motif} onChange={e => setForm({...form, motif: e.target.value})}>
                  <option value="Changement d'adresse">Changement d'adresse</option>
                  <option value="Mariage">Mariage</option>
                  <option value="Naissance">Naissance</option>
                  <option value="Divorce">Divorce</option>
                </select>
              </div>
            )}

            {/* Commentaire */}
            {form.type && (
              <div style={styles.field}>
                <label style={styles.label}>Commentaire (optionnel)</label>
                <textarea
                  rows={3}
                  placeholder="Informations complémentaires..."
                  style={{...styles.input, resize:'vertical'}}
                  value={form.commentaire}
                  onChange={e => setForm({...form, commentaire: e.target.value})}
                />
              </div>
            )}

            {/* Actions */}
            <div style={styles.modalActions}>
              <button onClick={() => setModalOpen(false)} style={styles.btnCancel}>Annuler</button>
              <button
                onClick={handleSubmit}
                disabled={!form.type}
                style={{...styles.btnSubmit, opacity: !form.type ? 0.6 : 1}}
              >
                Soumettre la demande
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — Détails */}
{detailModal && selectedDemande && (
  <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setDetailModal(false)}>
    <div style={styles.modal}>
      <div style={styles.modalTitle}>Détails de la demande</div>

      <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
        {[
          ['Type',            typeLabel[selectedDemande.type] || selectedDemande.type],
          ['Statut',          statusLabel[selectedDemande.statut] || selectedDemande.statut],
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

      <div style={{...styles.modalActions, marginTop:'24px'}}>
        <button onClick={() => setDetailModal(false)} style={styles.btnCancel}>Fermer</button>
        {selectedDemande.statut === 'en_attente' && (
          <button
            onClick={() => { setDetailModal(false); openEdit(selectedDemande) }}
            style={styles.btnSubmit}
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
  <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setEditModal(false)}>
    <div style={styles.modal}>
      <div style={styles.modalTitle}>Modifier la demande</div>

      {editForm.type === 'conge' && (
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Date de début</label>
            <input type="date" style={styles.input} value={editForm.date_debut} onChange={e=>setEditForm({...editForm,date_debut:e.target.value})} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Date de fin</label>
            <input type="date" style={styles.input} value={editForm.date_fin} onChange={e=>setEditForm({...editForm,date_fin:e.target.value})} />
          </div>
          <div style={{...styles.field,gridColumn:'1/-1'}}>
            <label style={styles.label}>Type de congé</label>
            <select style={styles.input} value={editForm.motif} onChange={e=>setEditForm({...editForm,motif:e.target.value})}>
              <option value="Congé annuel">Congé annuel</option>
              <option value="Congé maladie">Congé maladie</option>
              <option value="Congé exceptionnel">Congé exceptionnel</option>
              <option value="Congé sans solde">Congé sans solde</option>
            </select>
          </div>
        </div>
      )}

      {editForm.type === 'pret' && (
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Montant (DT)</label>
            <input type="number" style={styles.input} value={editForm.montant} onChange={e=>setEditForm({...editForm,montant:e.target.value})} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Durée</label>
            <select style={styles.input} value={editForm.duree} onChange={e=>setEditForm({...editForm,duree:e.target.value})}>
              <option value="3 mois">3 mois</option>
              <option value="6 mois">6 mois</option>
              <option value="12 mois">12 mois</option>
              <option value="24 mois">24 mois</option>
            </select>
          </div>
        </div>
      )}

      {editForm.type === 'autorisation' && (
        <div style={styles.formGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Date</label>
            <input type="date" style={styles.input} value={editForm.date_debut} onChange={e=>setEditForm({...editForm,date_debut:e.target.value})} />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Motif</label>
            <input type="text" style={styles.input} value={editForm.motif} onChange={e=>setEditForm({...editForm,motif:e.target.value})} />
          </div>
        </div>
      )}

      {editForm.type === 'document' && (
        <div style={styles.field}>
          <label style={styles.label}>Document souhaité</label>
          <select style={styles.input} value={editForm.motif} onChange={e=>setEditForm({...editForm,motif:e.target.value})}>
            <option value="Attestation de travail">Attestation de travail</option>
            <option value="Attestation de salaire">Attestation de salaire</option>
            <option value="Bulletin de paie">Bulletin de paie</option>
            <option value="Certificat de présence">Certificat de présence</option>
          </select>
        </div>
      )}

      {editForm.type === 'situation' && (
        <div style={styles.field}>
          <label style={styles.label}>Nature du changement</label>
          <select style={styles.input} value={editForm.motif} onChange={e=>setEditForm({...editForm,motif:e.target.value})}>
            <option value="Changement d'adresse">Changement d'adresse</option>
            <option value="Mariage">Mariage</option>
            <option value="Naissance">Naissance</option>
            <option value="Divorce">Divorce</option>
          </select>
        </div>
      )}

      <div style={{...styles.field, marginTop:'16px'}}>
        <label style={styles.label}>Commentaire</label>
        <textarea
          rows={3}
          style={{...styles.input, resize:'vertical'}}
          value={editForm.commentaire}
          onChange={e=>setEditForm({...editForm,commentaire:e.target.value})}
        />
      </div>

      <div style={styles.modalActions}>
        <button onClick={() => setEditModal(false)} style={styles.btnCancel}>Annuler</button>
        <button onClick={handleEdit} style={styles.btnSubmit}>
          Enregistrer
        </button>
      </div>
    </div>
  </div>
)}
    </Layout>
  )
}

// ── DATA ──
const typeLabel = {
  conge:'Congé annuel', pret:'Prêt', situation:'Situation',
  autorisation:'Autorisation', document:'Document',
}

const typeStyle = {
  conge:       { background:'#EFF6FF', color:'#1D4ED8' },
  pret:        { background:'#F5F3FF', color:'#7C3AED' },
  situation:   { background:'#FFF7ED', color:'#C2410C' },
  autorisation:{ background:'#FDF4FF', color:'#9333EA' },
  document:    { background:'var(--green-light)', color:'#15803D' },
  default:     { background:'var(--surface)', color:'var(--text2)' },
}

const statusLabel = {
  en_attente:'En attente', approuvee:'Approuvée',
  refusee:'Rejetée', valide_chef:'Validée chef',
}

const statusStyle = {
  en_attente:  { background:'#FFF7ED', color:'#EA580C' },
  approuvee:   { background:'var(--green-light)', color:'#16A34A' },
  refusee:     { background:'#FFF1F0', color:'var(--accent)' },
  valide_chef: { background:'var(--blue-light)', color:'#1D4ED8' },
}

// ── STYLES ──
const styles = {
  pageHeader:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px'},
  pageTitle:{fontFamily:'Instrument Serif, serif',fontSize:'24px',fontWeight:400,color:'var(--text)',letterSpacing:'-0.5px'},
  pageSub:{fontSize:'13px',color:'var(--text2)',marginTop:'4px'},
  btnNew:{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'10px 20px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:'Inter, sans-serif'},
  successBox:{background:'var(--green-light)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'10px',padding:'12px 16px',fontSize:'13px',color:'#16A34A',marginBottom:'16px'},
  tabs:{display:'flex',gap:'4px',marginBottom:'20px',background:'white',borderRadius:'10px',padding:'4px',width:'fit-content',border:'1px solid var(--border)'},
  tab:{padding:'7px 16px',borderRadius:'7px',fontSize:'13px',fontWeight:500,cursor:'pointer',color:'var(--text2)',border:'none',background:'none',fontFamily:'Inter, sans-serif'},
  tabActive:{background:'var(--surface)',color:'var(--text)',border:'1px solid var(--border)'},
  tableWrap:{background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',boxShadow:'var(--shadow-sm)'},
  loader:{padding:'48px',textAlign:'center',color:'var(--text2)'},
  empty:{padding:'64px',textAlign:'center',color:'var(--text2)'},
  table:{width:'100%',borderCollapse:'collapse'},
  th:{padding:'12px 16px',textAlign:'left',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--text2)',background:'var(--surface)',borderBottom:'1px solid var(--border)',fontWeight:600},
  tr:{'&:hover':{background:'var(--surface)'},borderBottom:'1px solid rgba(228,228,231,0.5)'},
  td:{padding:'14px 16px',fontSize:'13px',color:'var(--text)'},
  typeBadge:{fontSize:'11px',padding:'3px 10px',borderRadius:'6px',fontWeight:500},
  statusBadge:{fontSize:'10px',fontWeight:600,padding:'3px 10px',borderRadius:'20px',letterSpacing:'0.3px',textTransform:'uppercase'},
  actionBtn:{padding:'5px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:500,cursor:'pointer',border:'1px solid var(--border)',background:'none',color:'var(--text)',fontFamily:'Inter, sans-serif',marginRight:'4px'},
  actionBtnRed:{borderColor:'var(--accent)',color:'var(--accent)'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(4px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'white',border:'1px solid var(--border)',borderRadius:'16px',padding:'36px',width:'520px',maxWidth:'90vw',maxHeight:'85vh',overflowY:'auto',boxShadow:'var(--shadow-lg)'},
  modalTitle:{fontFamily:'Instrument Serif, serif',fontSize:'22px',fontWeight:400,color:'var(--text)',marginBottom:'24px'},
  formGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'},
  field:{marginBottom:'16px'},
  label:{display:'block',fontSize:'13px',fontWeight:500,color:'var(--text)',marginBottom:'8px'},
  input:{width:'100%',background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:'8px',padding:'10px 14px',fontSize:'14px',color:'var(--text)',fontFamily:'Inter, sans-serif',outline:'none'},
  modalActions:{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'28px'},
  btnCancel:{padding:'10px 20px',borderRadius:'8px',background:'none',border:'1px solid var(--border)',color:'var(--text2)',fontFamily:'Inter, sans-serif',fontSize:'13px',cursor:'pointer'},
  btnSubmit:{padding:'10px 24px',borderRadius:'8px',background:'var(--accent)',border:'none',color:'white',fontFamily:'Inter, sans-serif',fontSize:'13px',fontWeight:500,cursor:'pointer'},
}
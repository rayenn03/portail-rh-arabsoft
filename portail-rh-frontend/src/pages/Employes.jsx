import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import api from '../api/axios'
import s from '../styles/shared.module.css'
import p from './Employes.module.css'

export default function Employes() {
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [employes, setEmployes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [success, setSuccess]     = useState('')
  const [form, setForm] = useState({
    nom:'', prenom:'', email:'', password:'', role:'employe',
    departement:'', poste:'', telephone:'', chef_id:'',
  })
  const [editModal, setEditModal]   = useState(false)
  const [editForm, setEditForm]     = useState({})
  const [editId, setEditId]         = useState(null)
  // Gestion du solde de congés (admin)
  const [solde, setSolde]           = useState(null)
  const [soldeSaving, setSoldeSaving] = useState(false)
  const empPhotoInputRef = useRef(null)
  const [uploadingEmpPhoto, setUploadingEmpPhoto] = useState(false)

  const fetchEmployes = () => {
    setLoading(true)
    api.get('/users')
      .then(res => setEmployes(res.data))
      .catch(() => setEmployes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEmployes() }, [])

  // Filtrer par recherche
  const filtered = employes.filter(e =>
    `${e.prenom} ${e.nom} ${e.email} ${e.departement || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  // Chefs disponibles
  const chefs = employes.filter(e => e.role === 'chef')

  // Créer un employé
 const handleCreate = async () => {
  // Validation
  if (!form.prenom.trim()) return showToast('Le prénom est obligatoire.', 'error')
  if (!form.nom.trim()) return showToast('Le nom est obligatoire.', 'error')
  if (!form.email.trim()) return showToast('L\'email est obligatoire.', 'error')
  if (!form.email.includes('@')) return showToast('Email invalide.', 'error')
  if (form.password.length < 6) return showToast('Le mot de passe doit contenir au moins 6 caractères.', 'error')

  try {
    await api.post('/register', {
      ...form,
      password_confirmation: form.password,
    })
    setModalOpen(false)
    setForm({ nom:'', prenom:'', email:'', password:'', role:'employe', departement:'', poste:'', telephone:'', chef_id:'' })
    fetchEmployes()
    showToast('Employé créé avec succès !')
  } catch (e) {
    const errors = e.response?.data?.errors
    if (errors) {
      const msg = Object.values(errors).flat().join(' — ')
      showToast(msg, 'error')
    } else {
      showToast(e.response?.data?.message || 'Erreur lors de la création.', 'error')
    }
  }
}
  // Supprimer un employé
  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Supprimer l\'employé',
      message: 'Cette action est irréversible. Toutes les données associées (demandes, soldes, photo) seront perdues. Continuer ?',
      confirmText: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    try {
      await api.delete(`/users/${id}`)
      fetchEmployes()
      showToast('Employé supprimé.')
    } catch (e) {
      showToast('Erreur lors de la suppression.', 'error')
    }
  }
  const openEdit = (emp) => {
  setEditId(emp.id)
  setEditForm({
    nom:         emp.nom || '',
    prenom:      emp.prenom || '',
    email:       emp.email || '',
    role:        emp.role || 'employe',
    departement: emp.departement || '',
    poste:       emp.poste || '',
    telephone:   emp.telephone || '',
    chef_id:     emp.chef_id || '',
    password:    '',
    photo_url:   emp.photo_url || null,
  })
  setSolde(null)
  setEditModal(true)
  // Charger le solde de congés en parallèle (n'attend pas l'ouverture de la modale)
  api.get(`/users/${emp.id}/conges`)
    .then(res => setSolde(res.data.solde))
    .catch(() => setSolde(null))
}

// Sauvegarder le solde de congés
const handleSaveSolde = async () => {
  if (!solde) return
  setSoldeSaving(true)
  try {
    const res = await api.put(`/users/${editId}/conges`, {
      annuel_total:       solde.annuel_total,
      annuel_pris:        solde.annuel_pris,
      maladie_total:      solde.maladie_total,
      maladie_pris:       solde.maladie_pris,
      exceptionnel_total: solde.exceptionnel_total,
      exceptionnel_pris:  solde.exceptionnel_pris,
    })
    setSolde(res.data.solde)
    showToast('Solde de congés mis à jour.')
  } catch (e) {
    showToast(e.response?.data?.message || 'Erreur lors de la mise à jour du solde.', 'error')
  } finally {
    setSoldeSaving(false)
  }
}

const handleUploadEmpPhoto = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    showToast('La photo doit faire moins de 2 Mo.', 'error')
    e.target.value = ''
    return
  }
  setUploadingEmpPhoto(true)
  try {
    const fd = new FormData()
    fd.append('photo', file)
    const res = await api.post(`/users/${editId}/photo`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    setEditForm(prev => ({ ...prev, photo_url: res.data.photo_url }))
    fetchEmployes()
    showToast('Photo mise à jour.')
  } catch (err) {
    showToast(err.response?.data?.message || 'Erreur lors de l\'upload.', 'error')
  } finally {
    setUploadingEmpPhoto(false)
    e.target.value = ''
  }
}

const handleDeleteEmpPhoto = async () => {
  const ok = await confirm({
    title: 'Supprimer la photo',
    message: 'Voulez-vous supprimer la photo de profil de cet employé ?',
    confirmText: 'Supprimer',
    danger: true,
  })
  if (!ok) return
  try {
    await api.delete(`/users/${editId}/photo`)
    setEditForm(prev => ({ ...prev, photo_url: null }))
    fetchEmployes()
    showToast('Photo supprimée.')
  } catch {
    showToast('Erreur lors de la suppression.', 'error')
  }
}

const handleEdit = async () => {
  // Validation
  if (!editForm.prenom.trim()) return showToast('Le prénom est obligatoire.', 'error')
  if (!editForm.nom.trim()) return showToast('Le nom est obligatoire.', 'error')
  if (!editForm.email.trim()) return showToast('L\'email est obligatoire.', 'error')
  if (!editForm.email.includes('@')) return showToast('Email invalide.', 'error')
  if (editForm.password && editForm.password.length < 6) return showToast('Le mot de passe doit contenir au moins 6 caractères.', 'error')

  try {
    const data = { ...editForm }
    if (!data.password) delete data.password
    await api.put(`/users/${editId}`, data)
    setEditModal(false)
    fetchEmployes()
    showToast('Employé modifié avec succès !')
  } catch (e) {
    const errors = e.response?.data?.errors
    if (errors) {
      const msg = Object.values(errors).flat().join(' — ')
      showToast(msg, 'error')
    } else {
      showToast(e.response?.data?.message || 'Erreur lors de la modification.', 'error')
    }
  }
}

  // Role badge CSS helper
  const roleCss = { admin: p.roleAdmin, chef: p.roleChef, employe: p.roleEmploye }
  const roleLabel = { admin:'Admin RH', chef:'Chef', employe:'Employé' }

  return (
    <Layout title="Employés">

      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h2 className={s.pageTitle}>Employés</h2>
          <p className={s.pageSub}>
            {employes.length} utilisateurs au total —&nbsp;
            {employes.filter(e=>e.role==='employe').length} employés,&nbsp;
            {employes.filter(e=>e.role==='chef').length} chefs
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className={s.btnNew}>
          + Ajouter un employé
        </button>
      </div>

      {/* Toast géré par <ToastProvider> global */}

      {/* Search */}
      <div className={p.searchWrap}>
        <span className={p.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher par nom, email, département..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`input-glass ${p.searchInput}`}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className={p.empGrid}>
          {[0,1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{height:'200px', borderRadius:'12px'}} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>
          <div style={{fontSize:'40px',marginBottom:'12px'}}>👥</div>
          <div style={{fontWeight:500,color:'var(--text)'}}>Aucun employé trouvé</div>
        </div>
      ) : (
        <div className={p.empGrid}>
          {filtered.map((emp, i) => (
            <div key={i} className={`card-hover ${p.empCard}`}>

              {/* Avatar + infos */}
              <div className={p.empTop}>
                <div className={p.empAvatar} style={{background: avatarColors[i % avatarColors.length]}}>
                  {emp.photo_url
                    ? <img src={emp.photo_url} alt="" className={p.photoImg} />
                    : <>{emp.prenom?.[0]}{emp.nom?.[0]}</>}
                </div>
                <div style={{flex:1}}>
                  <div className={p.empName}>{emp.prenom} {emp.nom}</div>
                  <div className={p.empPoste}>{emp.poste || 'Non défini'}</div>
                </div>
                <span className={`${p.roleBadge} ${roleCss[emp.role] || ''}`}>
                  {roleLabel[emp.role] || emp.role}
                </span>
              </div>

              {/* Détails */}
              <div className={p.empDetails}>
                <div className={p.empDetail}>
                  <span className={p.detailIcon}>📧</span>
                  <span className={p.detailText}>{emp.email}</span>
                </div>
                {emp.departement && (
                  <div className={p.empDetail}>
                    <span className={p.detailIcon}>🏢</span>
                    <span className={p.detailText}>{emp.departement}</span>
                  </div>
                )}
                {emp.telephone && (
                  <div className={p.empDetail}>
                    <span className={p.detailIcon}>📞</span>
                    <span className={p.detailText}>{emp.telephone}</span>
                  </div>
                )}
                {emp.chef && (
                  <div className={p.empDetail}>
                    <span className={p.detailIcon}>👔</span>
                    <span className={p.detailText}>Chef : {emp.chef.prenom} {emp.chef.nom}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className={p.empActions}>
                <button onClick={() => openEdit(emp)} className={`btn-hover ${s.actionBtn}`}>✏️ Modifier</button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className={`btn-hover ${s.actionBtn} ${s.actionBtnRed}`}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL — Ajouter employé */}
      {modalOpen && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className={`modal-enter ${s.modal}`}>
            <div className={s.modalTitle}>Ajouter un employé</div>

            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label}>Prénom *</label>
                <input className={s.input} placeholder="ex: Ahmed" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Nom *</label>
                <input className={s.input} placeholder="ex: Benali" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} />
              </div>
              <div className={`${s.field} ${p.fieldFull}`}>
                <label className={s.label}>Email *</label>
                <input type="email" className={s.input} placeholder="ex: ahmed.benali@arabsoft.com.tn" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Mot de passe *</label>
                <input type="password" className={s.input} placeholder="min. 6 caractères" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Rôle *</label>
                <select className={s.input} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="employe">Employé</option>
                  <option value="chef">Chef Hiérarchique</option>
                  <option value="admin">Administrateur RH</option>
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>Département</label>
                <input className={s.input} placeholder="ex: Informatique" value={form.departement} onChange={e=>setForm({...form,departement:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Poste</label>
                <input className={s.input} placeholder="ex: Développeur" value={form.poste} onChange={e=>setForm({...form,poste:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Téléphone</label>
                <input className={s.input} placeholder="ex: +216 71 000 000" value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} />
              </div>
              {form.role === 'employe' && (
                <div className={`${s.field} ${p.fieldFull}`}>
                  <label className={s.label}>Chef hiérarchique</label>
                  <select className={s.input} value={form.chef_id} onChange={e=>setForm({...form,chef_id:e.target.value})}>
                    <option value="">-- Aucun --</option>
                    {chefs.map(c => (
                      <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className={s.modalActions}>
              <button onClick={() => setModalOpen(false)} className={`btn-hover ${s.btnCancel}`}>Annuler</button>
              <button
                onClick={handleCreate}
                className={`btn-hover ${s.btnSubmit}`}
              >
                Créer l'employé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL — Modifier employé */}
      {editModal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setEditModal(false)}>
          <div className={`modal-enter ${s.modal}`}>
            <div className={s.modalTitle}>Modifier l'employé</div>

            {/* Photo de profil */}
            <div className={p.photoSection}>
              <div className={p.photoPreview}>
                {editForm.photo_url
                  ? <img src={editForm.photo_url} alt="" className={p.photoImg} />
                  : `${(editForm.prenom?.[0] || '')}${(editForm.nom?.[0] || '')}`.toUpperCase()}
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                <button
                  type="button"
                  onClick={() => !uploadingEmpPhoto && empPhotoInputRef.current?.click()}
                  className={`btn-hover ${p.btnChangePhoto}`}
                >
                  📷 {uploadingEmpPhoto ? 'Envoi...' : 'Changer la photo'}
                </button>
                {editForm.photo_url && (
                  <button
                    type="button"
                    onClick={handleDeleteEmpPhoto}
                    className={`btn-hover ${p.btnDeletePhoto}`}
                  >
                    Supprimer la photo
                  </button>
                )}
                <input
                  ref={empPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{display:'none'}}
                  onChange={handleUploadEmpPhoto}
                />
              </div>
            </div>

            <div className={s.formGrid}>
              <div className={s.field}>
                <label className={s.label}>Prénom *</label>
                <input className={s.input} value={editForm.prenom} onChange={e=>setEditForm({...editForm,prenom:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Nom *</label>
                <input className={s.input} value={editForm.nom} onChange={e=>setEditForm({...editForm,nom:e.target.value})} />
              </div>
              <div className={`${s.field} ${p.fieldFull}`}>
                <label className={s.label}>Email *</label>
                <input type="email" className={s.input} value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Nouveau mot de passe</label>
                <input type="password" className={s.input} placeholder="Laisser vide = inchangé" value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Rôle *</label>
                <select className={s.input} value={editForm.role} onChange={e=>setEditForm({...editForm,role:e.target.value})}>
                  <option value="employe">Employé</option>
                  <option value="chef">Chef Hiérarchique</option>
                  <option value="admin">Administrateur RH</option>
                </select>
              </div>
              <div className={s.field}>
                <label className={s.label}>Département</label>
                <input className={s.input} value={editForm.departement} onChange={e=>setEditForm({...editForm,departement:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Poste</label>
                <input className={s.input} value={editForm.poste} onChange={e=>setEditForm({...editForm,poste:e.target.value})} />
              </div>
              <div className={s.field}>
                <label className={s.label}>Téléphone</label>
                <input className={s.input} value={editForm.telephone} onChange={e=>setEditForm({...editForm,telephone:e.target.value})} />
              </div>
              {editForm.role === 'employe' && (
                <div className={`${s.field} ${p.fieldFull}`}>
                  <label className={s.label}>Chef hiérarchique</label>
                  <select className={s.input} value={editForm.chef_id} onChange={e=>setEditForm({...editForm,chef_id:e.target.value})}>
                    <option value="">-- Aucun --</option>
                    {chefs.map(c => (
                      <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* ── Section SOLDE DE CONGÉS (admin) ─────────────────── */}
            {solde && (
              <div className={p.soldeSection}>
                <div className={p.soldeHeader}>
                  <div>
                    <div className={p.soldeTitle}>🏖️ Solde de congés {solde.annee}</div>
                    <div className={p.soldeSub}>
                      Modifiable par l'administrateur RH uniquement
                    </div>
                  </div>
                </div>

                <div className={p.soldeGrid}>
                  {/* Congé annuel */}
                  <div className={p.soldeCard} style={{borderColor:'rgba(255,45,32,0.25)'}}>
                    <div className={p.soldeCardTitle}>
                      <span style={{fontSize:'16px'}}>📅</span> Congé annuel
                    </div>
                    <div className={p.soldeCardBody}>
                      <div className={p.soldeField}>
                        <label className={p.soldeLabel}>Total (jours)</label>
                        <input
                          type="number" min="0" max="365"
                          className={p.soldeInput}
                          value={solde.annuel_total}
                          onChange={e => setSolde({...solde, annuel_total: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className={p.soldeField}>
                        <label className={p.soldeLabel}>Pris (jours)</label>
                        <input
                          type="number" min="0" max="365"
                          className={p.soldeInput}
                          value={solde.annuel_pris}
                          onChange={e => setSolde({...solde, annuel_pris: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className={p.soldeRestant}>
                        Restant : <strong style={{color:'var(--accent)'}}>
                          {Math.max(0, solde.annuel_total - solde.annuel_pris)} jours
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Congé maladie */}
                  <div className={p.soldeCard} style={{borderColor:'rgba(59,130,246,0.25)'}}>
                    <div className={p.soldeCardTitle}>
                      <span style={{fontSize:'16px'}}>🏥</span> Congé maladie
                    </div>
                    <div className={p.soldeCardBody}>
                      <div className={p.soldeField}>
                        <label className={p.soldeLabel}>Total (jours)</label>
                        <input
                          type="number" min="0" max="365"
                          className={p.soldeInput}
                          value={solde.maladie_total}
                          onChange={e => setSolde({...solde, maladie_total: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className={p.soldeField}>
                        <label className={p.soldeLabel}>Pris (jours)</label>
                        <input
                          type="number" min="0" max="365"
                          className={p.soldeInput}
                          value={solde.maladie_pris}
                          onChange={e => setSolde({...solde, maladie_pris: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className={p.soldeRestant}>
                        Restant : <strong style={{color:'#3B82F6'}}>
                          {Math.max(0, solde.maladie_total - solde.maladie_pris)} jours
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Congé exceptionnel */}
                  <div className={p.soldeCard} style={{borderColor:'rgba(34,197,94,0.25)'}}>
                    <div className={p.soldeCardTitle}>
                      <span style={{fontSize:'16px'}}>🎉</span> Congé exceptionnel
                    </div>
                    <div className={p.soldeCardBody}>
                      <div className={p.soldeField}>
                        <label className={p.soldeLabel}>Total (jours)</label>
                        <input
                          type="number" min="0" max="365"
                          className={p.soldeInput}
                          value={solde.exceptionnel_total}
                          onChange={e => setSolde({...solde, exceptionnel_total: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className={p.soldeField}>
                        <label className={p.soldeLabel}>Pris (jours)</label>
                        <input
                          type="number" min="0" max="365"
                          className={p.soldeInput}
                          value={solde.exceptionnel_pris}
                          onChange={e => setSolde({...solde, exceptionnel_pris: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className={p.soldeRestant}>
                        Restant : <strong style={{color:'#22C55E'}}>
                          {Math.max(0, solde.exceptionnel_total - solde.exceptionnel_pris)} jours
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveSolde}
                  disabled={soldeSaving}
                  className={`btn-hover ${p.btnSaveSolde}`}
                >
                  {soldeSaving ? 'Sauvegarde...' : '💾 Enregistrer les soldes de congés'}
                </button>
              </div>
            )}

            <div className={s.modalActions}>
              <button onClick={() => setEditModal(false)} className={`btn-hover ${s.btnCancel}`}>Annuler</button>
              <button onClick={handleEdit} className={`btn-hover ${s.btnSubmit}`}>
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

// ── DATA ──
const avatarColors = [
  'linear-gradient(135deg,#FF2D20,#c47c25)',
  'linear-gradient(135deg,#3B82F6,#1D4ED8)',
  'linear-gradient(135deg,#22C55E,#15803D)',
  'linear-gradient(135deg,#8B5CF6,#6D28D9)',
  'linear-gradient(135deg,#F97316,#EA580C)',
  'linear-gradient(135deg,#EC4899,#BE185D)',
]

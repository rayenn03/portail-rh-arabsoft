import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

export default function Employes() {
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
  if (!form.prenom.trim()) return alert('Le prénom est obligatoire.')
  if (!form.nom.trim()) return alert('Le nom est obligatoire.')
  if (!form.email.trim()) return alert('L\'email est obligatoire.')
  if (!form.email.includes('@')) return alert('Email invalide.')
  if (form.password.length < 6) return alert('Le mot de passe doit contenir au moins 6 caractères.')

  try {
    await api.post('/register', {
      ...form,
      password_confirmation: form.password,
    })
    setModalOpen(false)
    setForm({ nom:'', prenom:'', email:'', password:'', role:'employe', departement:'', poste:'', telephone:'', chef_id:'' })
    fetchEmployes()
    setSuccess('Employé créé avec succès !')
    setTimeout(() => setSuccess(''), 4000)
  } catch (e) {
    const errors = e.response?.data?.errors
    if (errors) {
      const msg = Object.values(errors).flat().join('\n')
      alert(msg)
    } else {
      alert(e.response?.data?.message || 'Erreur lors de la création.')
    }
  }
}
  // Supprimer un employé
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet employé ?')) return
    try {
      await api.delete(`/users/${id}`)
      fetchEmployes()
      setSuccess('Employé supprimé.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      alert('Erreur lors de la suppression.')
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
  })
  setEditModal(true)
}

const handleEdit = async () => {
  // Validation
  if (!editForm.prenom.trim()) return alert('Le prénom est obligatoire.')
  if (!editForm.nom.trim()) return alert('Le nom est obligatoire.')
  if (!editForm.email.trim()) return alert('L\'email est obligatoire.')
  if (!editForm.email.includes('@')) return alert('Email invalide.')
  if (editForm.password && editForm.password.length < 6) return alert('Le mot de passe doit contenir au moins 6 caractères.')

  try {
    const data = { ...editForm }
    if (!data.password) delete data.password
    await api.put(`/users/${editId}`, data)
    setEditModal(false)
    fetchEmployes()
    setSuccess('Employé modifié avec succès !')
    setTimeout(() => setSuccess(''), 4000)
  } catch (e) {
    const errors = e.response?.data?.errors
    if (errors) {
      const msg = Object.values(errors).flat().join('\n')
      alert(msg)
    } else {
      alert(e.response?.data?.message || 'Erreur lors de la modification.')
    }
  }
}
  const roleLabel = { admin:'Admin RH', chef:'Chef', employe:'Employé' }
  const roleStyle = {
    admin:   { background:'#F0FDF4', color:'#16A34A', border:'1px solid rgba(34,197,94,0.2)' },
    chef:    { background:'#FFF7ED', color:'#C2410C', border:'1px solid rgba(234,88,12,0.2)' },
    employe: { background:'var(--blue-light)', color:'#1D4ED8', border:'1px solid rgba(59,130,246,0.2)' },
  }

  return (
    <Layout title="Employés">

      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Employés</h2>
          <p style={styles.pageSub}>
            {employes.length} utilisateurs au total —&nbsp;
            {employes.filter(e=>e.role==='employe').length} employés,&nbsp;
            {employes.filter(e=>e.role==='chef').length} chefs
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} style={styles.btnNew}>
          + Ajouter un employé
        </button>
      </div>

      {/* Success */}
      {success && (
        <div style={styles.successBox}> ✅ {success}</div>
      )}

      {/* Search */}
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher par nom, email, département..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div style={styles.loader}>⏳ Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={styles.empty}>
          <div style={{fontSize:'40px',marginBottom:'12px'}}>👥</div>
          <div style={{fontWeight:500,color:'var(--text)'}}>Aucun employé trouvé</div>
        </div>
      ) : (
        <div style={styles.empGrid}>
          {filtered.map((emp, i) => (
            <div key={i} style={styles.empCard}>

              {/* Avatar + infos */}
              <div style={styles.empTop}>
                <div style={{...styles.empAvatar, background: avatarColors[i % avatarColors.length]}}>
                  {emp.prenom?.[0]}{emp.nom?.[0]}
                </div>
                <div style={{flex:1}}>
                  <div style={styles.empName}>{emp.prenom} {emp.nom}</div>
                  <div style={styles.empPoste}>{emp.poste || 'Non défini'}</div>
                </div>
                <span style={{...styles.roleBadge, ...roleStyle[emp.role]}}>
                  {roleLabel[emp.role] || emp.role}
                </span>
              </div>

              {/* Détails */}
              <div style={styles.empDetails}>
                <div style={styles.empDetail}>
                  <span style={styles.detailIcon}>📧</span>
                  <span style={styles.detailText}>{emp.email}</span>
                </div>
                {emp.departement && (
                  <div style={styles.empDetail}>
                    <span style={styles.detailIcon}>🏢</span>
                    <span style={styles.detailText}>{emp.departement}</span>
                  </div>
                )}
                {emp.telephone && (
                  <div style={styles.empDetail}>
                    <span style={styles.detailIcon}>📞</span>
                    <span style={styles.detailText}>{emp.telephone}</span>
                  </div>
                )}
                {emp.chef && (
                  <div style={styles.empDetail}>
                    <span style={styles.detailIcon}>👔</span>
                    <span style={styles.detailText}>Chef : {emp.chef.prenom} {emp.chef.nom}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={styles.empActions}>
                <button onClick={() => openEdit(emp)} style={styles.actionBtn}>✏️ Modifier</button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  style={{...styles.actionBtn, ...styles.actionBtnRed}}
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
        <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Ajouter un employé</div>

            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Prénom *</label>
                <input style={styles.input} placeholder="ex: Ahmed" value={form.prenom} onChange={e=>setForm({...form,prenom:e.target.value})} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nom *</label>
                <input style={styles.input} placeholder="ex: Benali" value={form.nom} onChange={e=>setForm({...form,nom:e.target.value})} />
              </div>
              <div style={{...styles.field, gridColumn:'1/-1'}}>
                <label style={styles.label}>Email *</label>
                <input type="email" style={styles.input} placeholder="ex: ahmed.benali@arabsoft.com.tn" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mot de passe *</label>
                <input type="password" style={styles.input} placeholder="min. 6 caractères" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Rôle *</label>
                <select style={styles.input} value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="employe">Employé</option>
                  <option value="chef">Chef Hiérarchique</option>
                  <option value="admin">Administrateur RH</option>
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Département</label>
                <input style={styles.input} placeholder="ex: Informatique" value={form.departement} onChange={e=>setForm({...form,departement:e.target.value})} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Poste</label>
                <input style={styles.input} placeholder="ex: Développeur" value={form.poste} onChange={e=>setForm({...form,poste:e.target.value})} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Téléphone</label>
                <input style={styles.input} placeholder="ex: +216 71 000 000" value={form.telephone} onChange={e=>setForm({...form,telephone:e.target.value})} />
              </div>
              {form.role === 'employe' && (
                <div style={{...styles.field, gridColumn:'1/-1'}}>
                  <label style={styles.label}>Chef hiérarchique</label>
                  <select style={styles.input} value={form.chef_id} onChange={e=>setForm({...form,chef_id:e.target.value})}>
                    <option value="">-- Aucun --</option>
                    {chefs.map(c => (
                      <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setModalOpen(false)} style={styles.btnCancel}>Annuler</button>
              <button
                onClick={handleCreate}
                disabled={!form.nom || !form.prenom || !form.email || !form.password}
                style={{...styles.btnSubmit, opacity: (!form.nom||!form.prenom||!form.email||!form.password) ? 0.6 : 1}}
              >
                Créer l'employé
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL — Modifier employé */}
{editModal && (
  <div style={styles.overlay} onClick={e => e.target === e.currentTarget && setEditModal(false)}>
    <div style={styles.modal}>
      <div style={styles.modalTitle}>Modifier l'employé</div>

      <div style={styles.formGrid}>
        <div style={styles.field}>
          <label style={styles.label}>Prénom *</label>
          <input style={styles.input} value={editForm.prenom} onChange={e=>setEditForm({...editForm,prenom:e.target.value})} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Nom *</label>
          <input style={styles.input} value={editForm.nom} onChange={e=>setEditForm({...editForm,nom:e.target.value})} />
        </div>
        <div style={{...styles.field, gridColumn:'1/-1'}}>
          <label style={styles.label}>Email *</label>
          <input type="email" style={styles.input} value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Nouveau mot de passe</label>
          <input type="password" style={styles.input} placeholder="Laisser vide = inchangé" value={editForm.password} onChange={e=>setEditForm({...editForm,password:e.target.value})} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Rôle *</label>
          <select style={styles.input} value={editForm.role} onChange={e=>setEditForm({...editForm,role:e.target.value})}>
            <option value="employe">Employé</option>
            <option value="chef">Chef Hiérarchique</option>
            <option value="admin">Administrateur RH</option>
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Département</label>
          <input style={styles.input} value={editForm.departement} onChange={e=>setEditForm({...editForm,departement:e.target.value})} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Poste</label>
          <input style={styles.input} value={editForm.poste} onChange={e=>setEditForm({...editForm,poste:e.target.value})} />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Téléphone</label>
          <input style={styles.input} value={editForm.telephone} onChange={e=>setEditForm({...editForm,telephone:e.target.value})} />
        </div>
        {editForm.role === 'employe' && (
          <div style={{...styles.field, gridColumn:'1/-1'}}>
            <label style={styles.label}>Chef hiérarchique</label>
            <select style={styles.input} value={editForm.chef_id} onChange={e=>setEditForm({...editForm,chef_id:e.target.value})}>
              <option value="">-- Aucun --</option>
              {chefs.map(c => (
                <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={styles.modalActions}>
        <button onClick={() => setEditModal(false)} style={styles.btnCancel}>Annuler</button>
        <button onClick={handleEdit} style={styles.btnSubmit}>
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

// ── STYLES ──
const styles = {
  pageHeader:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px'},
  pageTitle:{fontFamily:'Instrument Serif, serif',fontSize:'24px',fontWeight:400,color:'var(--text)',letterSpacing:'-0.5px'},
  pageSub:{fontSize:'13px',color:'var(--text2)',marginTop:'4px'},
  btnNew:{background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'10px 20px',fontSize:'13px',fontWeight:500,cursor:'pointer',fontFamily:'Inter, sans-serif'},
  successBox:{background:'var(--green-light)',border:'1px solid rgba(34,197,94,0.2)',borderRadius:'10px',padding:'12px 16px',fontSize:'13px',color:'#16A34A',marginBottom:'16px'},
  searchWrap:{position:'relative',marginBottom:'24px'},
  searchIcon:{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'14px'},
  searchInput:{width:'100%',maxWidth:'400px',background:'white',border:'1px solid var(--border2)',borderRadius:'10px',padding:'10px 14px 10px 38px',fontSize:'14px',color:'var(--text)',fontFamily:'Inter, sans-serif',outline:'none'},
  loader:{padding:'48px',textAlign:'center',color:'var(--text2)'},
  empty:{padding:'64px',textAlign:'center',color:'var(--text2)'},
  empGrid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'},
  empCard:{background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px',boxShadow:'var(--shadow-sm)',transition:'box-shadow 0.2s,transform 0.2s'},
  empTop:{display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'},
  empAvatar:{width:'44px',height:'44px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:600,color:'white',flexShrink:0},
  empName:{fontSize:'14px',fontWeight:600,color:'var(--text)',marginBottom:'2px'},
  empPoste:{fontSize:'12px',color:'var(--text2)'},
  roleBadge:{fontSize:'10px',fontWeight:600,padding:'3px 10px',borderRadius:'20px',letterSpacing:'0.3px',whiteSpace:'nowrap'},
  empDetails:{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px',paddingTop:'16px',borderTop:'1px solid var(--border)'},
  empDetail:{display:'flex',alignItems:'center',gap:'8px'},
  detailIcon:{fontSize:'13px',flexShrink:0},
  detailText:{fontSize:'12px',color:'var(--text2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  empActions:{display:'flex',gap:'8px',paddingTop:'12px',borderTop:'1px solid var(--border)'},
  actionBtn:{flex:1,padding:'7px',borderRadius:'7px',fontSize:'12px',fontWeight:500,cursor:'pointer',border:'1px solid var(--border)',background:'var(--surface)',color:'var(--text)',fontFamily:'Inter, sans-serif'},
  actionBtnRed:{border:'1px solid rgba(255,45,32,0.2)',background:'#FFF1F0',color:'var(--accent)'},
  overlay:{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(4px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'},
  modal:{background:'white',border:'1px solid var(--border)',borderRadius:'16px',padding:'36px',width:'560px',maxWidth:'90vw',maxHeight:'85vh',overflowY:'auto',boxShadow:'var(--shadow-lg)'},
  modalTitle:{fontFamily:'Instrument Serif, serif',fontSize:'22px',fontWeight:400,color:'var(--text)',marginBottom:'24px'},
  formGrid:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'},
  field:{display:'flex',flexDirection:'column'},
  label:{fontSize:'13px',fontWeight:500,color:'var(--text)',marginBottom:'8px'},
  input:{background:'var(--surface)',border:'1px solid var(--border2)',borderRadius:'8px',padding:'10px 14px',fontSize:'14px',color:'var(--text)',fontFamily:'Inter, sans-serif',outline:'none'},
  modalActions:{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'28px'},
  btnCancel:{padding:'10px 20px',borderRadius:'8px',background:'none',border:'1px solid var(--border)',color:'var(--text2)',fontFamily:'Inter, sans-serif',fontSize:'13px',cursor:'pointer'},
  btnSubmit:{padding:'10px 24px',borderRadius:'8px',background:'var(--accent)',border:'none',color:'white',fontFamily:'Inter, sans-serif',fontSize:'13px',fontWeight:500,cursor:'pointer'},
}
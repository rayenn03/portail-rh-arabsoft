import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function AllDemandes() {
  const { user } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all')

  const fetchDemandes = () => {
    setLoading(true)
    api.get('/demandes')
      .then(res => setDemandes(res.data))
      .catch(() => setDemandes([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDemandes() }, [])

  // Filtrer
  const filtered = demandes.filter(d => {
    if (tab === 'all')        return true
    if (tab === 'pending')    return d.statut === 'en_attente'
    if (tab === 'approved')   return d.statut === 'approuvee'
    if (tab === 'rejected')   return d.statut === 'refusee'
    if (tab === 'chef')       return d.statut === 'valide_chef'
    return true
  })

  // Approuver ou refuser une demande
  const handleAction = async (id, action) => {
    try {
      let statut
      if (action === 'approuver') {
        statut = user?.role === 'chef' ? 'valide_chef' : 'approuvee'
      } else {
        statut = 'refusee'
      }
      await api.put(`/demandes/${id}`, { statut })
      fetchDemandes()
    } catch (e) {
      alert('Erreur lors de la mise à jour.')
    }
  }

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

  return (
    <Layout title="Toutes les Demandes">

      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>Toutes les Demandes</h2>
          <p style={styles.pageSub}>Traitement et validation des demandes du personnel</p>
        </div>
        <div style={styles.countBadge}>
          {demandes.filter(d => d.statut === 'en_attente').length} en attente
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key:'all',      label:'Toutes',        count: demandes.length },
          { key:'pending',  label:'En attente',    count: demandes.filter(d=>d.statut==='en_attente').length },
          { key:'chef',     label:'Validées chef', count: demandes.filter(d=>d.statut==='valide_chef').length },
          { key:'approved', label:'Approuvées',    count: demandes.filter(d=>d.statut==='approuvee').length },
          { key:'rejected', label:'Rejetées',      count: demandes.filter(d=>d.statut==='refusee').length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{...styles.tab, ...(tab === t.key ? styles.tabActive : {})}}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{...styles.tabCount, ...(tab === t.key ? styles.tabCountActive : {})}}>
                {t.count}
              </span>
            )}
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
            <div style={{fontWeight:500,color:'var(--text)'}}>Aucune demande trouvée</div>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Employé','Type','Détails','Date','Statut','Actions'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={i} style={{borderBottom:'1px solid rgba(228,228,231,0.5)'}}>

                  {/* Employé */}
                  <td style={styles.td}>
                    <div style={styles.empCell}>
                      <div style={styles.empAvatar}>
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
                  <td style={styles.td}>
                    <span style={{...styles.typeBadge, ...typeStyle[d.type] || typeStyle.default}}>
                      {typeLabel[d.type] || d.type}
                    </span>
                  </td>

                  {/* Détails */}
                  <td style={styles.td}>
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
                  <td style={styles.td}>
                    <div style={{fontSize:'13px',color:'var(--text2)'}}>
                      {new Date(d.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </td>

                  {/* Statut */}
                  <td style={styles.td}>
                    <span style={{...styles.statusBadge, ...statusStyle[d.statut]}}>
                      {statusLabel[d.statut] || d.statut}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={styles.td}>
                    {canAct(d) ? (
                      <div style={{display:'flex',gap:'6px'}}>
                        <button
                          onClick={() => handleAction(d.id, 'approuver')}
                          style={styles.btnApprove}
                        >
                          ✓ {user?.role === 'chef' ? 'Valider' : 'Approuver'}
                        </button>
                        <button
                          onClick={() => handleAction(d.id, 'refuser')}
                          style={styles.btnReject}
                        >
                          ✗ Refuser
                        </button>
                      </div>
                    ) : (
                      <span style={{fontSize:'12px',color:'var(--text3)'}}>
                        {d.statut === 'approuvee' || d.statut === 'approuvee_direct'
                          ? '✓ Traitée'
                          : d.statut === 'refusee'
                          ? '✗ Refusée'
                          : d.statut === 'valide_chef'
                          ? '— Att. admin'
                          : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

// ── DATA ──
const typeLabel = {
  conge:'Congé', pret:'Prêt', situation:'Situation',
  autorisation:'Autorisation', document:'Document',
}

const typeStyle = {
  conge:        { background:'#EFF6FF', color:'#1D4ED8' },
  pret:         { background:'#F5F3FF', color:'#7C3AED' },
  situation:    { background:'#FFF7ED', color:'#C2410C' },
  autorisation: { background:'#FDF4FF', color:'#9333EA' },
  document:     { background:'var(--green-light)', color:'#15803D' },
  default:      { background:'var(--surface)', color:'var(--text2)' },
}

const statusLabel = {
  en_attente:      'En attente',
  valide_chef:     'Validée chef',
  approuvee:       'Approuvée',
  approuvee_direct:'Approuvée',
  refusee:         'Rejetée',
}

const statusStyle = {
  en_attente:       { background:'#FFF7ED', color:'#EA580C' },
  valide_chef:      { background:'var(--blue-light)', color:'#1D4ED8' },
  approuvee:        { background:'var(--green-light)', color:'#16A34A' },
  approuvee_direct: { background:'var(--green-light)', color:'#16A34A' },
  refusee:          { background:'#FFF1F0', color:'var(--accent)' },
}

// ── STYLES ──
const styles = {
  pageHeader:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'24px'},
  pageTitle:{fontFamily:'Instrument Serif, serif',fontSize:'24px',fontWeight:400,color:'var(--text)',letterSpacing:'-0.5px'},
  pageSub:{fontSize:'13px',color:'var(--text2)',marginTop:'4px'},
  countBadge:{background:'#FFF7ED',border:'1px solid rgba(234,88,12,0.2)',color:'#EA580C',padding:'8px 16px',borderRadius:'8px',fontSize:'13px',fontWeight:500},
  tabs:{display:'flex',gap:'4px',marginBottom:'20px',background:'white',borderRadius:'10px',padding:'4px',width:'fit-content',border:'1px solid var(--border)'},
  tab:{padding:'7px 14px',borderRadius:'7px',fontSize:'13px',fontWeight:500,cursor:'pointer',color:'var(--text2)',border:'none',background:'none',fontFamily:'Inter, sans-serif',display:'flex',alignItems:'center',gap:'6px'},
  tabActive:{background:'var(--surface)',color:'var(--text)',border:'1px solid var(--border)'},
  tabCount:{background:'var(--border)',color:'var(--text2)',fontSize:'11px',fontWeight:600,padding:'1px 6px',borderRadius:'10px'},
  tabCountActive:{background:'var(--accent)',color:'white'},
  tableWrap:{background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',boxShadow:'var(--shadow-sm)'},
  loader:{padding:'48px',textAlign:'center',color:'var(--text2)'},
  empty:{padding:'64px',textAlign:'center',color:'var(--text2)'},
  table:{width:'100%',borderCollapse:'collapse'},
  th:{padding:'12px 16px',textAlign:'left',fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.8px',color:'var(--text2)',background:'var(--surface)',borderBottom:'1px solid var(--border)',fontWeight:600},
  td:{padding:'14px 16px',fontSize:'13px',color:'var(--text)',verticalAlign:'middle'},
  empCell:{display:'flex',alignItems:'center',gap:'10px'},
  empAvatar:{width:'34px',height:'34px',borderRadius:'8px',background:'linear-gradient(135deg,var(--accent),#c47c25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,color:'white',flexShrink:0},
  typeBadge:{fontSize:'11px',padding:'3px 10px',borderRadius:'6px',fontWeight:500},
  statusBadge:{fontSize:'10px',fontWeight:600,padding:'3px 10px',borderRadius:'20px',letterSpacing:'0.3px',textTransform:'uppercase'},
  btnApprove:{padding:'5px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:500,cursor:'pointer',border:'1px solid rgba(34,197,94,0.3)',background:'var(--green-light)',color:'#16A34A',fontFamily:'Inter, sans-serif'},
  btnReject:{padding:'5px 12px',borderRadius:'6px',fontSize:'11px',fontWeight:500,cursor:'pointer',border:'1px solid rgba(255,45,32,0.2)',background:'#FFF1F0',color:'var(--accent)',fontFamily:'Inter, sans-serif'},
}

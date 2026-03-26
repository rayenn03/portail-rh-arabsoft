import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]       = useState(null)
  const [recentes, setRecentes] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    if (user.role === 'admin' || user.role === 'chef') {
      Promise.all([
        api.get('/users/dashboard').catch(() => ({ data: null })),
        api.get('/demandes').catch(() => ({ data: [] })),
      ]).then(([statsRes, demandesRes]) => {
        setStats(statsRes.data)
        setRecentes((demandesRes.data ?? []).slice(0, 4))
      }).finally(() => setLoading(false))
    } else {
      api.get('/me/stats')
        .then(res => setStats(res.data))
        .catch(() => setStats(null))
        .finally(() => setLoading(false))
    }
  }, [user])

  if (user?.role === 'admin' || user?.role === 'chef') {
    return <AdminChefDashboard user={user} stats={stats} recentes={recentes} loading={loading} navigate={navigate} />
  }
  return <EmployeDashboard user={user} stats={stats} loading={loading} navigate={navigate} />
}

/* ─── Dashboard Admin / Chef ─────────────────────────────────────────────── */
function AdminChefDashboard({ user, stats, recentes, loading, navigate }) {
  const statCards = [
    { label: 'Demandes en attente', value: stats?.demandes_en_attente ?? '—', icon: '📋', color: 'var(--accent)', bg: '#FFF1F0' },
    { label: 'Demandes approuvées', value: stats?.demandes_approuvees ?? '—', icon: '✅', color: 'var(--green)', bg: 'var(--green-light)' },
    { label: 'Total employés',      value: stats?.total_employes ?? '—',      icon: '👥', color: 'var(--blue)',  bg: 'var(--blue-light)' },
    { label: 'Total demandes',      value: stats?.total_demandes ?? '—',      icon: '📂', color: '#8B5CF6',     bg: '#F5F3FF' },
  ]

  return (
    <Layout title="Tableau de bord">
      <div style={styles.welcome}>
        <div>
          <h2 style={styles.welcomeTitle}>Bonjour, {user?.prenom} 👋</h2>
          <p style={styles.welcomeSub}>Voici un aperçu de l'activité RH d'aujourd'hui.</p>
        </div>
        <div style={styles.dateBadge}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {loading ? (
        <div style={styles.loader}>⏳ Chargement...</div>
      ) : (
        <div style={styles.statsGrid}>
          {statCards.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{...styles.statIcon, background: s.bg, color: s.color}}>{s.icon}</div>
              <div style={{...styles.statNum, color: s.color}}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.grid2}>
        <div style={styles.card}>
          <div style={{...styles.cardTitle, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>Demandes récentes</span>
            <button onClick={() => navigate('/all-demandes')} style={styles.linkBtn}>Voir tout →</button>
          </div>
          {recentes.length === 0 ? (
            <div style={{textAlign:'center', padding:'24px 0', color:'var(--text2)', fontSize:'13px'}}>
              Aucune demande pour l'instant
            </div>
          ) : recentes.map((d, i) => {
            const nom = d.employee ? `${d.employee.prenom} ${d.employee.nom}` : '—'
            const initiales = d.employee ? `${d.employee.prenom?.[0] ?? ''}${d.employee.nom?.[0] ?? ''}` : '??'
            const statutInfo = adminStatutMeta[d.statut] ?? { label: d.statut, sc: 'pending' }
            return (
              <div key={i} style={{...styles.reqItem, borderBottom: i < recentes.length-1 ? '1px solid var(--border)' : 'none'}}>
                <div style={styles.reqAvatar}>{initiales.toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div style={styles.reqName}>{nom}</div>
                  <div style={styles.reqType}>{typeLabelsAdmin[d.type] ?? d.type}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={styles.reqDate}>
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div style={{...styles.badge, ...badgeStyle[statutInfo.sc]}}>{statutInfo.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Solde de congés</div>
          {[
            { label:'Congés annuels',       used:18, total:30, color:'var(--accent)' },
            { label:'Congés maladie',       used:3,  total:10, color:'var(--blue)' },
            { label:'Congés exceptionnels', used:1,  total:5,  color:'var(--green)' },
          ].map((c, i) => (
            <div key={i} style={{marginBottom:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'8px'}}>
                <span style={{color:'var(--text2)'}}>{c.label}</span>
                <span style={{fontWeight:600,color:'var(--text)'}}>{c.used} / {c.total} jours</span>
              </div>
              <div style={styles.progressBg}>
                <div style={{...styles.progressFill, width:`${(c.used/c.total)*100}%`, background:c.color}} />
              </div>
            </div>
          ))}
          <div style={styles.infoBox}>
            💡 Il vous reste <strong style={{color:'var(--accent)'}}>12 jours</strong> de congés annuels utilisables avant le 31 décembre 2026.
          </div>
        </div>
      </div>
    </Layout>
  )
}

/* ─── Dashboard Employé ───────────────────────────────────────────────────── */
const typeLabels = {
  conge: 'Congé', pret: 'Prêt', situation: 'Situation', autorisation: 'Autorisation', document: 'Document'
}
const statutMeta = {
  en_attente:     { label: 'En attente',  sc: 'pending' },
  valide_chef:    { label: 'Validé chef', sc: 'processing' },
  approuvee:      { label: 'Approuvée',   sc: 'approved' },
  approuvee_direct: { label: 'Approuvée', sc: 'approved' },
  refusee:        { label: 'Refusée',     sc: 'refused' },
}

function EmployeDashboard({ user, stats, loading, navigate }) {
  const conge = stats?.conges
  const recentes = stats?.recentes ?? []

  const empStatCards = [
    { label: 'En attente',  value: stats?.en_attente ?? '—', icon: '⏳', color: '#EA580C',      bg: '#FFF7ED' },
    { label: 'Approuvées',  value: stats?.approuvees ?? '—', icon: '✅', color: 'var(--green)', bg: 'var(--green-light)' },
    { label: 'Refusées',    value: stats?.refusees   ?? '—', icon: '❌', color: '#EF4444',      bg: '#FEF2F2' },
    { label: 'Total',       value: stats?.total      ?? '—', icon: '📂', color: 'var(--blue)',  bg: 'var(--blue-light)' },
  ]

  const congesData = conge ? [
    { label: 'Congés annuels',       used: conge.annuel_pris,      total: conge.annuel_total,      color: 'var(--accent)' },
    { label: 'Congés maladie',       used: conge.maladie_pris,     total: conge.maladie_total,     color: 'var(--blue)' },
    { label: 'Congés exceptionnels', used: conge.exceptionnel_pris, total: conge.exceptionnel_total, color: 'var(--green)' },
  ] : []

  const resteAnnuel = conge ? conge.annuel_total - conge.annuel_pris : null

  return (
    <Layout title="Tableau de bord">
      {/* Welcome */}
      <div style={styles.welcome}>
        <div>
          <h2 style={styles.welcomeTitle}>Bonjour, {user?.prenom} 👋</h2>
          <p style={styles.welcomeSub}>Voici un aperçu de votre espace RH.</p>
        </div>
        <div style={styles.dateBadge}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div style={styles.loader}>⏳ Chargement...</div>
      ) : (
        <div style={styles.statsGrid}>
          {empStatCards.map((s, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{...styles.statIcon, background: s.bg, color: s.color}}>{s.icon}</div>
              <div style={{...styles.statNum, color: s.color}}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.grid2}>
        {/* Mes demandes récentes */}
        <div style={styles.card}>
          <div style={{...styles.cardTitle, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>Mes demandes récentes</span>
            <button onClick={() => navigate('/demandes')} style={styles.linkBtn}>Voir tout →</button>
          </div>
          {!loading && recentes.length === 0 && (
            <div style={styles.emptyState}>
              <div style={{fontSize:'32px', marginBottom:'8px'}}>📋</div>
              <div style={{color:'var(--text2)', fontSize:'13px'}}>Aucune demande pour l'instant</div>
              <button onClick={() => navigate('/demandes')} style={{...styles.primaryBtn, marginTop:'12px'}}>
                + Créer une demande
              </button>
            </div>
          )}
          {recentes.map((r, i) => {
            const meta = statutMeta[r.statut] ?? { label: r.statut, sc: 'pending' }
            return (
              <div key={i} style={{...styles.reqItem, borderBottom: i < recentes.length-1 ? '1px solid var(--border)' : 'none'}}>
                <div style={{...styles.reqAvatar, background: 'linear-gradient(135deg,var(--accent),#c47c25)'}}>
                  {(typeLabels[r.type] ?? r.type).slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={styles.reqName}>{typeLabels[r.type] ?? r.type}</div>
                  <div style={styles.reqType}>
                    {r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : '—'}
                    {r.date_fin ? ` → ${new Date(r.date_fin).toLocaleDateString('fr-FR')}` : ''}
                  </div>
                </div>
                <div style={styles.badge}>
                  <div style={{...styles.badge, ...badgeStyle[meta.sc]}}>{meta.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Solde congés + actions */}
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Mon solde de congés {conge ? new Date().getFullYear() : ''}</div>
            {loading ? (
              <div style={styles.loader}>⏳</div>
            ) : !conge ? (
              <div style={{color:'var(--text2)', fontSize:'13px', textAlign:'center', padding:'16px 0'}}>
                Aucun solde enregistré pour cette année.
              </div>
            ) : (
              <>
                {congesData.map((c, i) => (
                  <div key={i} style={{marginBottom:'18px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'13px',marginBottom:'7px'}}>
                      <span style={{color:'var(--text2)'}}>{c.label}</span>
                      <span style={{fontWeight:600,color:'var(--text)'}}>{c.used} / {c.total} jours</span>
                    </div>
                    <div style={styles.progressBg}>
                      <div style={{
                        ...styles.progressFill,
                        width: c.total > 0 ? `${Math.min((c.used/c.total)*100, 100)}%` : '0%',
                        background: c.color
                      }} />
                    </div>
                    <div style={{fontSize:'11px', color:'var(--text3)', marginTop:'4px'}}>
                      {c.total - c.used} jours restants
                    </div>
                  </div>
                ))}
                {resteAnnuel !== null && (
                  <div style={styles.infoBox}>
                    💡 Il vous reste <strong style={{color:'var(--accent)'}}>{resteAnnuel} jour{resteAnnuel > 1 ? 's' : ''}</strong> de congés annuels utilisables avant le 31 décembre {new Date().getFullYear()}.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions rapides */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Actions rapides</div>
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <button onClick={() => navigate('/demandes')} style={styles.actionBtn}>
                <span style={styles.actionIcon}>📋</span>
                <span>Nouvelle demande</span>
              </button>
              <button onClick={() => navigate('/demandes')} style={{...styles.actionBtn, background:'var(--blue-light)', color:'var(--blue)'}}>
                <span style={styles.actionIcon}>📂</span>
                <span>Mes demandes</span>
              </button>
              <button onClick={() => navigate('/profil')} style={{...styles.actionBtn, background:'var(--green-light)', color:'var(--green)'}}>
                <span style={styles.actionIcon}>👤</span>
                <span>Mon profil</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

/* ─── Styles & badge helpers ─────────────────────────────────────────────── */
const typeLabelsAdmin = {
  conge: 'Congé', pret: 'Prêt', situation: 'Situation',
  autorisation: 'Autorisation', document: 'Document',
}

const adminStatutMeta = {
  en_attente:       { label: 'En attente',  sc: 'pending' },
  valide_chef:      { label: 'Validé chef', sc: 'processing' },
  approuvee:        { label: 'Approuvée',   sc: 'approved' },
  approuvee_direct: { label: 'Approuvée',   sc: 'approved' },
  refusee:          { label: 'Refusée',     sc: 'refused' },
}

const badgeStyle = {
  pending:    { background:'#FFF7ED', color:'#EA580C' },
  approved:   { background:'var(--green-light)', color:'#16A34A' },
  processing: { background:'var(--blue-light)', color:'#1D4ED8' },
  refused:    { background:'#FEF2F2', color:'#EF4444' },
}

const styles = {
  welcome:      {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'28px',flexWrap:'wrap',gap:'12px'},
  welcomeTitle: {fontFamily:'Instrument Serif, serif',fontSize:'28px',fontWeight:400,color:'var(--text)',letterSpacing:'-0.5px',marginBottom:'4px'},
  welcomeSub:   {fontSize:'14px',color:'var(--text2)'},
  dateBadge:    {background:'white',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',color:'var(--text2)'},
  loader:       {textAlign:'center',padding:'40px',color:'var(--text2)'},
  statsGrid:    {display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'24px'},
  statCard:     {background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'22px',boxShadow:'var(--shadow-sm)'},
  statIcon:     {width:'44px',height:'44px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',marginBottom:'14px'},
  statNum:      {fontFamily:'Instrument Serif, serif',fontSize:'36px',fontWeight:400,lineHeight:1,marginBottom:'4px'},
  statLabel:    {fontSize:'12px',color:'var(--text2)',fontWeight:500},
  grid2:        {display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'},
  card:         {background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'24px',boxShadow:'var(--shadow-sm)'},
  cardTitle:    {fontFamily:'Instrument Serif, serif',fontSize:'16px',fontWeight:400,color:'var(--text)',marginBottom:'20px'},
  reqItem:      {display:'flex',alignItems:'center',gap:'12px',padding:'12px 0'},
  reqAvatar:    {width:'36px',height:'36px',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:600,color:'white',flexShrink:0},
  reqName:      {fontSize:'13px',fontWeight:500,color:'var(--text)',marginBottom:'2px'},
  reqType:      {fontSize:'11px',color:'var(--text2)'},
  reqDate:      {fontSize:'11px',color:'var(--text2)',marginBottom:'4px'},
  badge:        {fontSize:'10px',fontWeight:600,padding:'3px 8px',borderRadius:'20px',display:'inline-block'},
  progressBg:   {background:'var(--surface)',borderRadius:'4px',height:'8px',overflow:'hidden'},
  progressFill: {height:'100%',borderRadius:'4px',transition:'width 0.5s ease'},
  infoBox:      {background:'#FFF1F0',border:'1px solid rgba(255,45,32,0.15)',borderRadius:'8px',padding:'12px 14px',fontSize:'12px',color:'var(--text2)',marginTop:'8px'},
  emptyState:   {textAlign:'center',padding:'24px 0'},
  linkBtn:      {background:'none',border:'none',color:'var(--accent)',fontSize:'12px',cursor:'pointer',fontWeight:500,padding:0},
  primaryBtn:   {background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:600,cursor:'pointer'},
  actionBtn:    {display:'flex',alignItems:'center',gap:'10px',background:'#FFF1F0',color:'var(--accent)',border:'none',borderRadius:'8px',padding:'12px 14px',fontSize:'13px',fontWeight:500,cursor:'pointer',textAlign:'left'},
  actionIcon:   {fontSize:'16px'},
}

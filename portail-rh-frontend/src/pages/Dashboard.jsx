import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import p from './Dashboard.module.css'

// Animated counter: counts from 0 to value in ~700ms
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  const raf = useRef(null)
  useEffect(() => {
    if (value === '—' || value === undefined) { setDisplay('—'); return }
    const target = Number(value)
    if (isNaN(target)) { setDisplay(value); return }
    const start = Date.now()
    const duration = 700
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  return <>{display}</>
}

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
        api.get('/demandes?page=1').catch(() => ({ data: [] })),
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

// ── Helpers graphiques ────────────────────────────────────────────────────
const MOIS_FR = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const TYPE_COLORS = {
  conge: '#FF2D20', pret: '#3B82F6', autorisation: '#8B5CF6',
  document: '#22C55E', situation: '#F59E0B',
}
const TYPE_LABELS_CHART = {
  conge: 'Congé', pret: 'Prêt', autorisation: 'Autorisation',
  document: 'Document', situation: 'Situation',
}
const TooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 2 }}>{label}</div>
      <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{payload[0].value} demande{payload[0].value > 1 ? 's' : ''}</div>
    </div>
  )
}
const TooltipPie = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
      <div style={{ color: payload[0].payload.fill, fontWeight: 700 }}>{payload[0].name}</div>
      <div style={{ color: 'var(--text)' }}>{payload[0].value} demande{payload[0].value > 1 ? 's' : ''}</div>
    </div>
  )
}

/* ─── Dashboard Admin / Chef ─────────────────────────────────────────────── */
function AdminChefDashboard({ user, stats, recentes, loading, navigate }) {
  const statCards = [
    { label: 'Demandes en attente', value: stats?.demandes_en_attente ?? '—', icon: '📋', color: 'var(--accent)', bg: 'rgba(255,45,32,0.10)', border: 'rgba(255,45,32,0.30)' },
    { label: 'Demandes approuvées', value: stats?.demandes_approuvees ?? '—', icon: '✅', color: 'var(--green)', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)' },
    { label: 'Total employés',      value: stats?.total_employes ?? '—',      icon: '👥', color: 'var(--blue)',  bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)' },
    { label: 'Total demandes',      value: stats?.total_demandes ?? '—',      icon: '📂', color: '#8B5CF6',     bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.25)' },
  ]

  return (
    <Layout title="Tableau de bord">
      <div className={p.welcome}>
        <div>
          <h2 className={p.welcomeTitle}>Bonjour, {user?.prenom} 👋</h2>
          <p className={p.welcomeSub}>Voici un aperçu de l'activité RH d'aujourd'hui.</p>
        </div>
        <div className={p.dateBadge}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {loading ? (
        <div className={p.statsGrid}>
          {[0,1,2,3].map(i => (
            <div key={i} className="skeleton" style={{height:'110px'}} />
          ))}
        </div>
      ) : (
        <div className={p.statsGrid}>
          {statCards.map((s, i) => (
            <div key={i} className={`card-hover ${p.statCard}`} style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className={p.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className={p.statNum} style={{ color: s.color }}><AnimatedNumber value={s.value} /></div>
              <div className={p.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className={p.grid2}>
        <div className={`card-hover ${p.card}`}>
          <div className={p.cardTitle} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Demandes récentes</span>
            <button onClick={() => navigate('/all-demandes')} className={p.linkBtn}>Voir tout →</button>
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
              <div key={i} className={`table-row ${p.reqItem}`} style={{ borderBottom: i < recentes.length-1 ? '1px solid var(--border)' : 'none', borderRadius:'8px', padding:'12px 8px' }}>
                <div className={p.reqAvatar}>{initiales.toUpperCase()}</div>
                <div style={{flex:1}}>
                  <div className={p.reqName}>{nom}</div>
                  <div className={p.reqType}>{typeLabelsAdmin[d.type] ?? d.type}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className={p.reqDate}>
                    {new Date(d.created_at).toLocaleDateString('fr-FR')}
                  </div>
                  <div className={p.badge} style={badgeStyle[statutInfo.sc]}>{statutInfo.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className={`card-hover ${p.card}`}>
          <div className={p.cardTitle}>Solde de congés</div>
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
              <div className={p.progressBg}>
                <div className={p.progressFill} style={{ width:`${(c.used/c.total)*100}%`, background:c.color }} />
              </div>
            </div>
          ))}
          <div className={p.infoBox}>
            💡 Il vous reste <strong style={{color:'var(--accent)'}}>12 jours</strong> de congés annuels utilisables avant le 31 décembre 2026.
          </div>
        </div>
      </div>

      {/* ── Graphiques analytiques ── */}
      {!loading && (
        <div className={p.grid2} style={{marginTop:'20px'}}>

          {/* BarChart — demandes par mois */}
          <div className={`card-hover ${p.card}`}>
            <div className={p.cardTitle}>📈 Demandes par mois</div>
            {(stats?.par_mois ?? []).length === 0 ? (
              <div style={{textAlign:'center', padding:'32px 0', color:'var(--text2)', fontSize:'13px'}}>Aucune donnée disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(stats.par_mois ?? []).map(m => ({
                  mois: MOIS_FR[m.mois] + (m.annee !== new Date().getFullYear() ? ` ${m.annee}` : ''),
                  total: m.total,
                }))} barSize={28}>
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                  <Tooltip content={<TooltipBar />} cursor={{ fill: 'var(--surface)' }} />
                  <Bar dataKey="total" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* PieChart — répartition par type */}
          <div className={`card-hover ${p.card}`}>
            <div className={p.cardTitle}>🥧 Répartition par type</div>
            {(stats?.par_type ?? []).length === 0 ? (
              <div style={{textAlign:'center', padding:'32px 0', color:'var(--text2)', fontSize:'13px'}}>Aucune donnée disponible</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={(stats.par_type ?? []).map(t => ({
                      name: TYPE_LABELS_CHART[t.type] ?? t.type,
                      value: t.total,
                      fill: TYPE_COLORS[t.type] ?? '#94A3B8',
                    }))}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                  >
                    {(stats.par_type ?? []).map((t, i) => (
                      <Cell key={i} fill={TYPE_COLORS[t.type] ?? '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<TooltipPie />} />
                  <Legend
                    iconType="circle" iconSize={8}
                    formatter={v => <span style={{ color: 'var(--text2)', fontSize: 11 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      )}

    </Layout>
  )
}

/* ─── Dashboard Employé ───────────────────────────────────────────────────── */
const typeLabels = {
  conge: 'Congé', pret: 'Prêt', situation: 'Situation', autorisation: 'Autorisation', document: 'Document'
}
const statutMeta = {
  en_attente:       { label: 'En attente',  sc: 'pending' },
  valide_chef:      { label: 'Validé chef', sc: 'processing' },
  approuvee:        { label: 'Approuvée',   sc: 'approved' },
  approuvee_direct: { label: 'Approuvée',   sc: 'approved' },
  refusee:          { label: 'Refusée',     sc: 'refused' },
}

function EmployeDashboard({ user, stats, loading, navigate }) {
  const conge = stats?.conges
  const recentes = stats?.recentes ?? []

  const empStatCards = [
    { label: 'En attente',  value: stats?.en_attente ?? '—', icon: '⏳', color: '#EA580C',      bg: 'rgba(249,115,22,0.10)', border: 'rgba(249,115,22,0.25)' },
    { label: 'Approuvées',  value: stats?.approuvees ?? '—', icon: '✅', color: 'var(--green)', bg: 'rgba(34,197,94,0.10)', border: 'rgba(34,197,94,0.25)' },
    { label: 'Refusées',    value: stats?.refusees   ?? '—', icon: '❌', color: '#EF4444',      bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' },
    { label: 'Total',       value: stats?.total      ?? '—', icon: '📂', color: 'var(--blue)',  bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.25)' },
  ]

  const congesData = conge ? [
    { label: 'Congés annuels',       used: conge.annuel_pris,       total: conge.annuel_total,       color: 'var(--accent)' },
    { label: 'Congés maladie',       used: conge.maladie_pris,      total: conge.maladie_total,      color: 'var(--blue)' },
    { label: 'Congés exceptionnels', used: conge.exceptionnel_pris, total: conge.exceptionnel_total, color: 'var(--green)' },
  ] : []

  const resteAnnuel = conge ? conge.annuel_total - conge.annuel_pris : null

  return (
    <Layout title="Tableau de bord">
      {/* Welcome */}
      <div className={p.welcome}>
        <div>
          <h2 className={p.welcomeTitle}>Bonjour, {user?.prenom} 👋</h2>
          <p className={p.welcomeSub}>Voici un aperçu de votre espace RH.</p>
        </div>
        <div className={p.dateBadge}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className={p.statsGrid}>
          {[0,1,2,3].map(i => (
            <div key={i} className="skeleton" style={{height:'110px'}} />
          ))}
        </div>
      ) : (
        <div className={p.statsGrid}>
          {empStatCards.map((s, i) => (
            <div key={i} className={`card-hover ${p.statCard}`} style={{ background: s.bg, border: `1px solid ${s.border}` }}>
              <div className={p.statIcon} style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className={p.statNum} style={{ color: s.color }}><AnimatedNumber value={s.value} /></div>
              <div className={p.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className={p.grid2}>
        {/* Mes demandes récentes */}
        <div className={`card-hover ${p.card}`}>
          <div className={p.cardTitle} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>Mes demandes récentes</span>
            <button onClick={() => navigate('/demandes')} className={p.linkBtn}>Voir tout →</button>
          </div>
          {!loading && recentes.length === 0 && (
            <div className={p.emptyState}>
              <div style={{fontSize:'32px', marginBottom:'8px'}}>📋</div>
              <div style={{color:'var(--text2)', fontSize:'13px'}}>Aucune demande pour l'instant</div>
              <button onClick={() => navigate('/demandes')} className={`${p.primaryBtn}`} style={{marginTop:'12px'}}>
                + Créer une demande
              </button>
            </div>
          )}
          {recentes.map((r, i) => {
            const meta = statutMeta[r.statut] ?? { label: r.statut, sc: 'pending' }
            return (
              <div key={i} className={`table-row ${p.reqItem}`} style={{ borderBottom: i < recentes.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div className={p.reqAvatar} style={{ background: 'linear-gradient(135deg,var(--accent),#c47c25)' }}>
                  {(typeLabels[r.type] ?? r.type).slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div className={p.reqName}>{typeLabels[r.type] ?? r.type}</div>
                  <div className={p.reqType}>
                    {r.date_debut ? new Date(r.date_debut).toLocaleDateString('fr-FR') : '—'}
                    {r.date_fin ? ` → ${new Date(r.date_fin).toLocaleDateString('fr-FR')}` : ''}
                  </div>
                </div>
                <div className={p.badge} style={badgeStyle[meta.sc]}>{meta.label}</div>
              </div>
            )
          })}
        </div>

        {/* Solde congés + actions */}
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
          <div className={`card-hover ${p.card}`}>
            <div className={p.cardTitle}>Mon solde de congés {conge ? new Date().getFullYear() : ''}</div>
            {loading ? (
              <div className={p.loader}>⏳</div>
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
                    <div className={p.progressBg}>
                      <div className={p.progressFill} style={{
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
                  <div className={p.infoBox}>
                    💡 Il vous reste <strong style={{color:'var(--accent)'}}>{resteAnnuel} jour{resteAnnuel > 1 ? 's' : ''}</strong> de congés annuels utilisables avant le 31 décembre {new Date().getFullYear()}.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions rapides */}
          <div className={`card-hover ${p.card}`}>
            <div className={p.cardTitle}>Actions rapides</div>
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <button onClick={() => navigate('/demandes')} className={`btn-hover ${p.actionBtn}`}>
                <span className={p.actionIcon}>📋</span>
                <span>Nouvelle demande</span>
              </button>
              <button onClick={() => navigate('/demandes')} className={`btn-hover ${p.actionBtn}`} style={{background:'rgba(59,130,246,0.10)', color:'var(--blue)', border:'1px solid rgba(59,130,246,0.20)'}}>
                <span className={p.actionIcon}>📂</span>
                <span>Mes demandes</span>
              </button>
              <button onClick={() => navigate('/profil')} className={`btn-hover ${p.actionBtn}`} style={{background:'rgba(34,197,94,0.10)', color:'var(--green)', border:'1px solid rgba(34,197,94,0.20)'}}>
                <span className={p.actionIcon}>👤</span>
                <span>Mon profil</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

/* ─── Lookup tables & badge helpers ─────────────────────────────────────── */
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
  pending:    { background:'rgba(234,88,12,0.15)', color:'#EA580C', border:'1px solid rgba(234,88,12,0.25)' },
  approved:   { background:'rgba(34,197,94,0.15)', color:'#22C55E', border:'1px solid rgba(34,197,94,0.25)' },
  processing: { background:'rgba(59,130,246,0.15)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.25)' },
  refused:    { background:'rgba(255,45,32,0.15)', color:'#FF6B63', border:'1px solid rgba(255,45,32,0.25)' },
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import p from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      // Redirection selon le rôle
      if (user.role === 'admin' || user.role === 'chef') {
        navigate('/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect')
      setForm({ email: '', password: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div className={p.page}>
        {/* LEFT — Branding */}
        <div className={p.left}>
          <div className={p.leftInner}>
            <Link to="/" className={p.logo}>
              <div className={p.logoMark}>A</div>
              <span className={p.logoName}>Arab<span style={{color:'var(--accent)'}}>Soft</span></span>
            </Link>

            <div className={p.leftContent}>
              <div className={p.leftTag}>Portail RH Digitale</div>
              <h2 className={p.leftTitle}>
                Gérez vos RH<br/>
                en toute <em style={{fontStyle:'italic',color:'var(--accent)'}}>simplicité</em>
              </h2>
              <p className={p.leftDesc}>
                Accédez à votre espace personnel sécurisé et gérez toutes vos demandes administratives depuis un seul endroit.
              </p>

              {/* Features list */}
              <div className={p.featList}>
                {[
                  { icon:'🏖️', text:'Demandes de congé en ligne' },
                  { icon:'📄', text:'Documents administratifs instantanés' },
                  { icon:'🤖', text:'Assistant IA disponible 24h/7j' },
                  { icon:'🔔', text:'Notifications en temps réel' },
                ].map((f, i) => (
                  <div key={i} className={p.featItem}>
                    <div className={p.featDot}>{f.icon}</div>
                    <span className={p.featText}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer left */}
            <div className={p.leftFooter}>
              <div className={p.isoBadge}>✓ ISO 9001 Certifiée</div>
              <span style={{fontSize:'12px',color:'#71717A'}}>© 2026 ArabSoft</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className={p.right}>
          <div className={p.card}>
            {/* Header */}
            <div className={p.cardHeader}>
              <h1 className={p.cardTitle}>Connexion</h1>
              <p className={p.cardSub}>Connectez-vous à votre espace RH</p>
            </div>

            {/* Error */}
            {error && (
              <div className={p.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className={p.form}>
              <div className={p.field}>
                <label className={p.label}>Adresse email</label>
                <input
                  type="email"
                  placeholder="ex: ahmed.benali@arabsoft.com.tn"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                  className={p.input}
                />
              </div>

              <div className={p.field}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <label className={p.label} style={{marginBottom:0}}>Mot de passe</label>
                  <Link to="/forgot-password" style={{fontSize:'12px',color:'var(--accent)',textDecoration:'none',fontWeight:500}}>
                    Mot de passe oublié ?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                  className={p.input}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={p.btnSubmit}
              >
                {loading ? '⏳ Connexion...' : 'Se connecter →'}
              </button>
            </form>

            {/* Divider */}
            <div className={p.divider}>
              <div className={p.divLine}/>
              <span className={p.divText}>ou tester avec</span>
              <div className={p.divLine}/>
            </div>

            {/* Quick login buttons */}
            <div className={p.quickBtns}>
              {[
                { label:'👤 Employé', email:'employe@portailrh.com', color:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.25)', text:'#60A5FA' },
                { label:'👔 Chef', email:'chef@portailrh.com', color:'rgba(249,115,22,0.12)', border:'rgba(249,115,22,0.25)', text:'#FB923C' },
                { label:'🛡️ Admin', email:'admin@portailrh.com', color:'rgba(34,197,94,0.12)', border:'rgba(34,197,94,0.25)', text:'#4ADE80' },
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setForm({ email: q.email, password: '123456' })}
                  className={p.quickBtn}
                  style={{background: q.color, border:`1px solid ${q.border}`, color: q.text}}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Back to landing */}
            <div className={p.backLink}>
              <Link to="/" style={{fontSize:'13px',color:'var(--text2)',textDecoration:'none'}}>
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      <div style={styles.page}>
        {/* LEFT — Branding */}
        <div style={styles.left}>
          <div style={styles.leftInner}>
            <Link to="/" style={styles.logo}>
              <div style={styles.logoMark}>A</div>
              <span style={styles.logoName}>Arab<span style={{color:'var(--accent)'}}>Soft</span></span>
            </Link>

            <div style={styles.leftContent}>
              <div style={styles.leftTag}>Portail RH Digitale</div>
              <h2 style={styles.leftTitle}>
                Gérez vos RH<br/>
                en toute <em style={{fontStyle:'italic',color:'var(--accent)'}}>simplicité</em>
              </h2>
              <p style={styles.leftDesc}>
                Accédez à votre espace personnel sécurisé et gérez toutes vos demandes administratives depuis un seul endroit.
              </p>

              {/* Features list */}
              <div style={styles.featList}>
                {[
                  { icon:'🏖️', text:'Demandes de congé en ligne' },
                  { icon:'📄', text:'Documents administratifs instantanés' },
                  { icon:'🤖', text:'Assistant IA disponible 24h/7j' },
                  { icon:'🔔', text:'Notifications en temps réel' },
                ].map((f, i) => (
                  <div key={i} style={styles.featItem}>
                    <div style={styles.featDot}>{f.icon}</div>
                    <span style={styles.featText}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer left */}
            <div style={styles.leftFooter}>
              <div style={styles.isoBadge}>✓ ISO 9001 Certifiée</div>
              <span style={{fontSize:'12px',color:'#71717A'}}>© 2026 ArabSoft</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div style={styles.right}>
          <div style={styles.card}>
            {/* Header */}
            <div style={styles.cardHeader}>
              <h1 style={styles.cardTitle}>Connexion</h1>
              <p style={styles.cardSub}>Connectez-vous à votre espace RH</p>
            </div>

            {/* Error */}
            {error && (
              <div style={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Adresse email</label>
                <input
                  type="email"
                  placeholder="ex: ahmed.benali@arabsoft.com.tn"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>

              <div style={styles.field}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                  <label style={styles.label}>Mot de passe</label>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{...styles.btnSubmit, opacity: loading ? 0.7 : 1}}
              >
                {loading ? '⏳ Connexion...' : 'Se connecter →'}
              </button>
            </form>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.divLine}/>
              <span style={styles.divText}>ou tester avec</span>
              <div style={styles.divLine}/>
            </div>

            {/* Quick login buttons */}
            <div style={styles.quickBtns}>
              {[
                { label:'👤 Employé', email:'employe@portailrh.com', color:'#EFF6FF', border:'#BFDBFE', text:'#1D4ED8' },
                { label:'👔 Chef', email:'chef@portailrh.com', color:'#FFF7ED', border:'#FED7AA', text:'#C2410C' },
                { label:'🛡️ Admin', email:'admin@portailrh.com', color:'#F0FDF4', border:'#BBF7D0', text:'#15803D' },
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setForm({ email: q.email, password: '123456' })}
                  style={{...styles.quickBtn, background: q.color, border:`1px solid ${q.border}`, color: q.text}}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Back to landing */}
            <div style={styles.backLink}>
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

const styles = {
  page:{display:'grid',gridTemplateColumns:'1fr 1fr',minHeight:'100vh'},

  // LEFT
  left:{background:'#18181B',display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'},
  leftInner:{display:'flex',flexDirection:'column',height:'100%',padding:'40px 48px',position:'relative',zIndex:1},
  logo:{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'},
  logoMark:{width:'34px',height:'34px',background:'var(--accent)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'16px',fontFamily:'Instrument Serif, serif',fontStyle:'italic'},
  logoName:{fontSize:'17px',fontWeight:600,color:'white',letterSpacing:'-0.3px'},
  leftContent:{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',maxWidth:'380px'},
  leftTag:{fontSize:'11px',fontWeight:600,textTransform:'uppercase',letterSpacing:'1.5px',color:'var(--accent)',marginBottom:'16px'},
  leftTitle:{fontFamily:'Instrument Serif, serif',fontSize:'42px',fontWeight:400,color:'white',lineHeight:1.1,letterSpacing:'-1px',marginBottom:'16px'},
  leftDesc:{fontSize:'15px',color:'#71717A',lineHeight:1.7,marginBottom:'36px'},
  featList:{display:'flex',flexDirection:'column',gap:'14px'},
  featItem:{display:'flex',alignItems:'center',gap:'12px'},
  featDot:{width:'32px',height:'32px',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',flexShrink:0},
  featText:{fontSize:'14px',color:'#A1A1AA'},
  leftFooter:{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto',paddingTop:'32px'},
  isoBadge:{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.2)',color:'#4ADE80',padding:'5px 12px',borderRadius:'100px',fontSize:'12px',fontWeight:500},

  // RIGHT
  right:{background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 32px'},
  card:{width:'100%',maxWidth:'420px'},
  cardHeader:{marginBottom:'32px'},
  cardTitle:{fontFamily:'Instrument Serif, serif',fontSize:'32px',fontWeight:400,color:'var(--text)',letterSpacing:'-0.8px',marginBottom:'8px'},
  cardSub:{fontSize:'15px',color:'var(--text2)'},

  // Form
  form:{display:'flex',flexDirection:'column',gap:'20px',marginBottom:'24px'},
  field:{display:'flex',flexDirection:'column'},
  label:{fontSize:'13px',fontWeight:500,color:'var(--text)',marginBottom:'8px',letterSpacing:'0.1px'},
  input:{background:'white',border:'1px solid var(--border2)',borderRadius:'10px',padding:'11px 14px',fontSize:'14px',color:'var(--text)',outline:'none',transition:'border-color 0.15s',fontFamily:'Inter, sans-serif'},
  btnSubmit:{background:'var(--accent)',color:'white',border:'none',borderRadius:'10px',padding:'13px',fontSize:'15px',fontWeight:500,cursor:'pointer',fontFamily:'Inter, sans-serif',transition:'all 0.2s',boxShadow:'0 4px 14px rgba(255,45,32,0.25)'},

  // Error
  errorBox:{background:'#FFF1F0',border:'1px solid rgba(255,45,32,0.2)',borderRadius:'10px',padding:'12px 16px',fontSize:'13px',color:'var(--accent)',display:'flex',alignItems:'center',gap:'8px',marginBottom:'20px'},

  // Divider
  divider:{display:'flex',alignItems:'center',gap:'12px',margin:'0 0 20px'},
  divLine:{flex:1,height:'1px',background:'var(--border)'},
  divText:{fontSize:'12px',color:'var(--text3)',whiteSpace:'nowrap'},

  // Quick login
  quickBtns:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'24px'},
  quickBtn:{padding:'8px 4px',borderRadius:'8px',fontSize:'12px',fontWeight:500,cursor:'pointer',fontFamily:'Inter, sans-serif',transition:'all 0.15s'},

  backLink:{textAlign:'center'},
}
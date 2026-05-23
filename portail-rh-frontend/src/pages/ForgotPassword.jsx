import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import p from './ForgotPassword.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/forgot-password', { email })
      setSubmitted(true)
    } catch (err) {
      const status = err.response?.status
      if (status === 409) setError('Une demande est déjà en cours de traitement.')
      else if (status === 422) setError('Aucun compte ne correspond à cet email.')
      else setError(err.response?.data?.message || 'Une erreur est survenue. Réessayez.')
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
              <div className={p.leftTag}>Récupération de compte</div>
              <h2 className={p.leftTitle}>
                Mot de passe<br/>
                <em style={{fontStyle:'italic',color:'var(--accent)'}}>oublié ?</em>
              </h2>
              <p className={p.leftDesc}>
                Pas de panique. Soumettez une demande à l'administrateur RH et vous recevrez un lien sécurisé pour réinitialiser votre mot de passe.
              </p>

              <div className={p.featList}>
                {[
                  { icon:'📧', text:'Saisissez votre email professionnel' },
                  { icon:'👨‍💼', text:'L\'administrateur examine la demande' },
                  { icon:'🔗', text:'Recevez un lien sécurisé par email' },
                  { icon:'🔒', text:'Définissez un nouveau mot de passe' },
                ].map((f, i) => (
                  <div key={i} className={p.featItem}>
                    <div className={p.featDot}>{f.icon}</div>
                    <span className={p.featText}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={p.leftFooter}>
              <div className={p.isoBadge}>✓ Sécurisé · Lien expirant en 15 min</div>
              <span style={{fontSize:'12px',color:'#71717A'}}>© 2026 ArabSoft</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className={p.right}>
          <div className={p.card}>
            {!submitted ? (
              <>
                <div className={p.cardHeader}>
                  <h1 className={p.cardTitle}>Mot de passe oublié ?</h1>
                  <p className={p.cardSub}>Entrez votre adresse email et nous enverrons votre demande à l'administrateur RH.</p>
                </div>

                {error && (
                  <div className={p.errorBox}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className={p.form}>
                  <div className={p.field}>
                    <label className={p.label}>Email</label>
                    <input
                      type="email"
                      placeholder="votre@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className={p.input}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={p.btnSubmit}
                  >
                    {loading ? '⏳ Envoi en cours...' : 'Envoyer la demande →'}
                  </button>
                </form>
              </>
            ) : (
              <div className={p.successWrap}>
                <div className={p.checkCircle}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h1 className={p.successTitle}>Demande envoyée !</h1>
                <p className={p.successSub}>
                  Votre demande a été envoyée à l'administrateur.
                </p>
                <p style={{fontSize:'14px',color:'var(--text2)',textAlign:'center',lineHeight:1.6}}>
                  Vous recevrez un email à <strong style={{color:'var(--accent)'}}>{email}</strong> dès qu'elle sera approuvée.
                </p>
              </div>
            )}

            <div className={p.backLink}>
              <Link to="/login" style={{fontSize:'13px',color:'var(--accent)',textDecoration:'none',fontWeight:500}}>
                ← Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

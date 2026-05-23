import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import p from './ResetPassword.module.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const email = params.get('email') || ''

  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [showPwdConfirm, setShowPwdConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !email) {
      setTokenValid(false)
      setValidating(false)
      return
    }
    api.get('/reset-password/validate', { params: { token, email } })
      .then(res => setTokenValid(!!res.data.valid))
      .catch(() => setTokenValid(false))
      .finally(() => setValidating(false))
  }, [token, email])

  const pwdLongEnough = password.length >= 6
  const pwdMatch = password && password === confirm
  const canSubmit = pwdLongEnough && pwdMatch && !loading

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!canSubmit) return
    setLoading(true)
    try {
      await api.post('/reset-password', {
        token, email,
        password,
        password_confirmation: confirm,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue. Réessayez.')
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
              <div className={p.leftTag}>Sécurité du compte</div>
              <h2 className={p.leftTitle}>
                Créez un<br/>
                <em style={{fontStyle:'italic',color:'var(--accent)'}}>nouveau</em> mot de passe
              </h2>
              <p className={p.leftDesc}>
                Choisissez un mot de passe robuste pour protéger votre compte. Une fois validé, vous pourrez vous reconnecter immédiatement.
              </p>

              <div className={p.featList}>
                {[
                  { icon:'🔐', text:'Au moins 6 caractères' },
                  { icon:'✓', text:'Mélangez lettres, chiffres et symboles' },
                  { icon:'🚫', text:'Évitez les mots de passe déjà utilisés' },
                  { icon:'⏱', text:'Lien valide 15 minutes seulement' },
                ].map((f, i) => (
                  <div key={i} className={p.featItem}>
                    <div className={p.featDot}>{f.icon}</div>
                    <span className={p.featText}>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={p.leftFooter}>
              <div className={p.isoBadge}>✓ Connexion chiffrée TLS</div>
              <span style={{fontSize:'12px',color:'#71717A'}}>© 2026 ArabSoft</span>
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div className={p.right}>
          <div className={p.card}>
            {validating ? (
              <div className={p.validatingText}>
                ⏳ Vérification du lien...
              </div>
            ) : !tokenValid ? (
              <>
                <div className={p.cardHeader}>
                  <h1 className={p.cardTitle}>Lien invalide</h1>
                  <p className={p.cardSub}>Ce lien de réinitialisation est invalide ou a expiré.</p>
                </div>
                <div className={p.errorBox} style={{marginBottom:'24px'}}>
                  <span>⚠️</span> Veuillez soumettre une nouvelle demande de réinitialisation.
                </div>
                <div className={p.backLink}>
                  <Link to="/forgot-password" style={{fontSize:'13px',color:'var(--accent)',textDecoration:'none',fontWeight:500}}>
                    → Nouvelle demande
                  </Link>
                </div>
              </>
            ) : success ? (
              <>
                <div className={p.successWrap}>
                  <div className={p.checkCircle}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h1 className={p.successTitle}>Mot de passe réinitialisé !</h1>
                  <p className={p.successSub}>
                    Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous reconnecter.
                  </p>
                </div>
                <div className={p.backLink}>
                  <Link to="/login" className={p.btnSubmit}>
                    Se connecter →
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className={p.cardHeader}>
                  <h1 className={p.cardTitle}>Réinitialiser votre mot de passe</h1>
                  <p className={p.cardSub}>Entrez un nouveau mot de passe pour votre compte <strong style={{color:'var(--accent)'}}>{email}</strong>.</p>
                </div>

                {error && (
                  <div className={p.errorBox}>
                    <span>⚠️</span> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className={p.form}>
                  {/* Nouveau mot de passe */}
                  <div className={p.field}>
                    <label className={p.label}>Nouveau mot de passe</label>
                    <div className={p.inputWrap}>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className={p.input}
                      />
                      <button type="button" onClick={() => setShowPwd(s => !s)} className={p.eyeBtn} tabIndex={-1}>
                        {showPwd ? '🙈' : '👁'}
                      </button>
                    </div>
                    <div className={`${p.hint} ${pwdLongEnough ? p.hintOk : ''}`}>
                      {pwdLongEnough ? '✓' : '○'} Au moins 6 caractères
                    </div>
                  </div>

                  {/* Confirmer */}
                  <div className={p.field}>
                    <label className={p.label}>Confirmer le mot de passe</label>
                    <div className={p.inputWrap}>
                      <input
                        type={showPwdConfirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        required
                        className={p.input}
                      />
                      <button type="button" onClick={() => setShowPwdConfirm(s => !s)} className={p.eyeBtn} tabIndex={-1}>
                        {showPwdConfirm ? '🙈' : '👁'}
                      </button>
                    </div>
                    {confirm && (
                      <div className={`${p.hint} ${pwdMatch ? p.hintOk : p.hintErr}`}>
                        {pwdMatch ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={p.btnSubmit}
                  >
                    {loading ? '⏳ Réinitialisation...' : 'Réinitialiser le mot de passe →'}
                  </button>
                </form>

                <div className={p.backLink}>
                  <Link to="/login" style={{fontSize:'13px',color:'var(--accent)',textDecoration:'none',fontWeight:500}}>
                    ← Retour à la connexion
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

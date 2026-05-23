import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import api from '../api/axios'
import p from './Profil.module.css'

export default function Profil() {
  const { user, login, refreshUser } = useAuth()
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const fileInputRef = useRef(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // ─── État formulaire infos ───────────────────────────────────────────────
  const [infoForm, setInfoForm] = useState({
    nom:         user?.nom         || '',
    prenom:      user?.prenom      || '',
    email:       user?.email       || '',
    telephone:   user?.telephone   || '',
    departement: user?.departement || '',
    poste:       user?.poste       || '',
  })

  // ─── État formulaire mot de passe ────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({
    current_password:      '',
    password:              '',
    password_confirmation: '',
  })

  // ─── Messages succès / erreur ────────────────────────────────────────────
  const [infoMsg,  setInfoMsg]  = useState(null)
  const [pwdMsg,   setPwdMsg]   = useState(null)
  const [infoErr,  setInfoErr]  = useState(null)
  const [pwdErr,   setPwdErr]   = useState(null)

  // ─── États de chargement ─────────────────────────────────────────────────
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPwd,  setSavingPwd]  = useState(false)

  // ─── Champ actuellement en focus (bordure rouge dynamique) ───────────────
  const [focusedField, setFocusedField] = useState(null)

  // ─── Détecter les modifications non sauvegardées ─────────────────────────
  const [isDirty, setIsDirty] = useState(false)

  // ─── Auto-disparition des messages après 3-4 secondes ────────────────────
  useEffect(() => {
    if (!infoMsg) return
    const t = setTimeout(() => setInfoMsg(null), 3000)
    return () => clearTimeout(t)
  }, [infoMsg])

  useEffect(() => {
    if (!pwdMsg) return
    const t = setTimeout(() => setPwdMsg(null), 3000)
    return () => clearTimeout(t)
  }, [pwdMsg])

  useEffect(() => {
    if (!infoErr) return
    const t = setTimeout(() => setInfoErr(null), 4000)
    return () => clearTimeout(t)
  }, [infoErr])

  useEffect(() => {
    if (!pwdErr) return
    const t = setTimeout(() => setPwdErr(null), 4000)
    return () => clearTimeout(t)
  }, [pwdErr])

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const roleLabel = { employe:'Employé', chef:'Chef Hiérarchique', admin:'Administrateur RH' }
  const roleColor = {
    employe: { background:'rgba(59,130,246,0.15)', color:'#60A5FA', border:'1px solid rgba(59,130,246,0.25)' },
    chef:    { background:'rgba(147,51,234,0.15)', color:'#C084FC', border:'1px solid rgba(147,51,234,0.25)' },
    admin:   { background:'rgba(34,197,94,0.15)',  color:'#22C55E', border:'1px solid rgba(34,197,94,0.25)' },
  }
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase()

  // ─── Style dynamique d'un input selon focus et disabled ──────────────────
  // border, boxShadow, cursor, opacity sont 100 % calculés depuis l'état JS
  const inputStyle = (name, disabled = false) => ({
    border: focusedField === name
      ? '1px solid var(--accent)'
      : '1px solid var(--border)',
    background: 'var(--surface)',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.7 : 1,
    boxShadow: focusedField === name ? '0 0 0 3px rgba(255,45,32,0.10)' : 'none',
  })

  // ─── Mettre à jour un champ info + marquer comme modifié ─────────────────
  const updateInfo = (field, value) => {
    setInfoForm(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  // ─── Upload / suppression photo de profil ────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setInfoErr('La photo doit faire moins de 2 Mo.')
      e.target.value = ''
      return
    }
    setUploadingPhoto(true)
    setInfoMsg(null); setInfoErr(null)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      await api.post(`/users/${user.id}/photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await refreshUser()
      setInfoMsg('Photo de profil mise à jour.')
    } catch (err) {
      setInfoErr(err.response?.data?.message || 'Erreur lors de l\'upload.')
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const handlePhotoDelete = async () => {
    const ok = await confirm({
      title: 'Supprimer la photo',
      message: 'Voulez-vous supprimer votre photo de profil ?',
      confirmText: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    setInfoMsg(null); setInfoErr(null)
    try {
      await api.delete(`/users/${user.id}/photo`)
      await refreshUser()
      setInfoMsg('Photo supprimée.')
      showToast('Photo de profil supprimée.', 'success')
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la suppression.'
      setInfoErr(msg)
      showToast(msg, 'error')
    }
  }

  // ─── Sauvegarder les infos personnelles ──────────────────────────────────
  const handleSaveInfo = async (e) => {
    e.preventDefault()
    setInfoMsg(null); setInfoErr(null)
    if (!infoForm.prenom.trim() || !infoForm.nom.trim()) {
      const m = 'Le prénom et le nom sont obligatoires.'
      setInfoErr(m); showToast(m, 'error'); return
    }
    if (!infoForm.email.trim() || !/\S+@\S+\.\S+/.test(infoForm.email)) {
      const m = 'Email invalide.'
      setInfoErr(m); showToast(m, 'error'); return
    }
    setSavingInfo(true)
    try {
      const res = await api.put(`/users/${user.id}`, infoForm)
      setInfoMsg('Informations mises à jour avec succès.')
      showToast('Informations mises à jour.', 'success')
      setIsDirty(false)
      const token = localStorage.getItem('token')
      login(res.data.user, token)
    } catch (err) {
      const m = err.response?.data?.message || 'Erreur lors de la mise à jour.'
      setInfoErr(m); showToast(m, 'error')
    } finally {
      setSavingInfo(false)
    }
  }

  // ─── Changer le mot de passe ──────────────────────────────────────────────
  const handleSavePwd = async (e) => {
    e.preventDefault()
    setPwdMsg(null); setPwdErr(null)
    if (!pwdForm.current_password) {
      const m = 'Veuillez saisir votre mot de passe actuel.'
      setPwdErr(m); showToast(m, 'error'); return
    }
    if (!pwdForm.password) {
      const m = 'Veuillez saisir un nouveau mot de passe.'
      setPwdErr(m); showToast(m, 'error'); return
    }
    if (pwdForm.password.length < 8) {
      const m = 'Le mot de passe doit contenir au moins 8 caractères.'
      setPwdErr(m); showToast(m, 'error'); return
    }
    if (pwdForm.password !== pwdForm.password_confirmation) {
      const m = 'Les mots de passe ne correspondent pas.'
      setPwdErr(m); showToast(m, 'error'); return
    }
    setSavingPwd(true)
    try {
      await api.put(`/users/${user.id}`, {
        current_password: pwdForm.current_password,
        password:         pwdForm.password,
      })
      setPwdMsg('Mot de passe modifié avec succès.')
      showToast('Mot de passe modifié.', 'success')
      setPwdForm({ current_password: '', password: '', password_confirmation: '' })
    } catch (err) {
      const m = err.response?.data?.message || 'Erreur lors du changement de mot de passe.'
      setPwdErr(m); showToast(m, 'error')
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <Layout title="Mon Profil">

      {/* ── Hero Header (gradient) ── */}
      <div className={p.heroHeader}>
        <div>
          <h2 className={p.heroTitle}>Mon Profil</h2>
          <p className={p.heroSub}>Gérez vos informations personnelles, votre sécurité et téléchargez votre badge ArabSoft</p>
        </div>
        <div className={p.heroIcon}>👤</div>
      </div>

      {/* ══════════════════════════════════════
          CARTE AVATAR + INFOS SYNTHÈSE
      ══════════════════════════════════════ */}
      <div style={{ marginBottom:'24px' }}>
        <div className={`card-hover ${p.avatarCard}`}>
          <div className={p.avatarHeader}>
            <div className={p.avatarCircle}>
              {user?.photo_url
                ? <img src={user.photo_url} alt={initials} className={p.avatarImg} />
                : initials}
              <div
                className={p.avatarOverlay}
                onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                title="Changer la photo"
              >
                {uploadingPhoto ? '…' : '📷'}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <div style={{ flex:1, minWidth:0 }}>
              <div className={p.avatarName}>{user?.prenom} {user?.nom}</div>
              <div className={p.avatarEmail}>{user?.email}</div>
              <span className={p.roleBadge} style={roleColor[user?.role] || {}}>
                {roleLabel[user?.role] || user?.role}
              </span>
            </div>
          </div>

          <div className={p.avatarMetaGrid}>
            <div className={p.avatarMetaItem}>
              <div className={p.avatarMetaLabel}>Département</div>
              <div className={p.avatarMetaValue}>{user?.departement || '—'}</div>
            </div>
            <div className={p.avatarMetaItem}>
              <div className={p.avatarMetaLabel}>Poste</div>
              <div className={p.avatarMetaValue}>{user?.poste || '—'}</div>
            </div>
            <div className={p.avatarMetaItem}>
              <div className={p.avatarMetaLabel}>Téléphone</div>
              <div className={p.avatarMetaValue}>{user?.telephone || '—'}</div>
            </div>
            <div className={p.avatarMetaItem}>
              <div className={p.avatarMetaLabel}>Chef hiérarchique</div>
              <div className={p.avatarMetaValue}>
                {user?.chef ? `${user.chef.prenom} ${user.chef.nom}` : '—'}
              </div>
            </div>
          </div>

          {user?.photo_url && (
            <button onClick={handlePhotoDelete} className={p.deletePhotoBtn}>
              🗑 Supprimer la photo de profil
            </button>
          )}
        </div>
      </div>

      <div className={p.grid}>

        {/* ══════════════════════════════════════
            CARTE 1 — Informations personnelles
        ══════════════════════════════════════ */}
        <div className={`card-hover ${p.card}`}>
          <div className={p.cardHeader}>
            <div className={p.cardIcon}>👤</div>
            <div>
              <div className={p.cardTitle}>Informations personnelles</div>
              <div className={p.cardSub}>Modifiez vos coordonnées</div>
            </div>
          </div>

          {infoMsg && <div className={p.alertSuccess}>{infoMsg}</div>}
          {infoErr && <div className={p.alertError}>{infoErr}</div>}

          <form onSubmit={handleSaveInfo}>
            <div className={p.row}>
              <div className={p.field}>
                <label className={p.label}>Prénom</label>
                <input
                  className={p.input}
                  style={inputStyle('prenom', savingInfo)}
                  value={infoForm.prenom}
                  onChange={e => updateInfo('prenom', e.target.value)}
                  onFocus={() => setFocusedField('prenom')}
                  onBlur={() => setFocusedField(null)}
                  disabled={savingInfo}
                  required
                />
              </div>
              <div className={p.field}>
                <label className={p.label}>Nom</label>
                <input
                  className={p.input}
                  style={inputStyle('nom', savingInfo)}
                  value={infoForm.nom}
                  onChange={e => updateInfo('nom', e.target.value)}
                  onFocus={() => setFocusedField('nom')}
                  onBlur={() => setFocusedField(null)}
                  disabled={savingInfo}
                  required
                />
              </div>
            </div>

            <div className={p.field}>
              <label className={p.label}>Email</label>
              <input
                className={p.input}
                style={inputStyle('email', savingInfo)}
                type="email"
                value={infoForm.email}
                onChange={e => updateInfo('email', e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                disabled={savingInfo}
                required
              />
            </div>

            <div className={p.field}>
              <label className={p.label}>Téléphone</label>
              <input
                className={p.input}
                style={inputStyle('telephone', savingInfo)}
                value={infoForm.telephone}
                onChange={e => updateInfo('telephone', e.target.value)}
                onFocus={() => setFocusedField('telephone')}
                onBlur={() => setFocusedField(null)}
                disabled={savingInfo}
                placeholder="+216 XX XXX XXX"
              />
            </div>

            <div className={p.row}>
              <div className={p.field}>
                <label className={p.label}>Département</label>
                <input
                  className={p.input}
                  style={inputStyle('departement', savingInfo)}
                  value={infoForm.departement}
                  onChange={e => updateInfo('departement', e.target.value)}
                  onFocus={() => setFocusedField('departement')}
                  onBlur={() => setFocusedField(null)}
                  disabled={savingInfo}
                />
              </div>
              <div className={p.field}>
                <label className={p.label}>Poste</label>
                <input
                  className={p.input}
                  style={inputStyle('poste', savingInfo)}
                  value={infoForm.poste}
                  onChange={e => updateInfo('poste', e.target.value)}
                  onFocus={() => setFocusedField('poste')}
                  onBlur={() => setFocusedField(null)}
                  disabled={savingInfo}
                />
              </div>
            </div>

            {/* Rôle — toujours désactivé (lecture seule) */}
            <div className={p.field}>
              <label className={p.label}>Rôle</label>
              <input
                className={p.input}
                style={inputStyle('role', true)}
                value={roleLabel[user?.role] || user?.role}
                readOnly
              />
            </div>

            <div className={p.cardFooter}>
              <button
                type="submit"
                className={`btn-hover ${p.btnSave}`}
                style={{
                  background: isDirty ? '#EA580C' : 'var(--accent)',
                }}
                disabled={savingInfo}
              >
                {savingInfo
                  ? 'Enregistrement...'
                  : isDirty
                  ? '● Sauvegarder les modifications'
                  : '✓ À jour'}
              </button>
            </div>
          </form>
        </div>

        {/* ══════════════════════════════════════
            CARTE 2 — Sécurité / mot de passe
        ══════════════════════════════════════ */}
        <div className={`card-hover ${p.card}`}>
          <div className={p.cardHeader}>
            <div className={p.cardIcon}>🔒</div>
            <div>
              <div className={p.cardTitle}>Sécurité</div>
              <div className={p.cardSub}>Changez votre mot de passe</div>
            </div>
          </div>

          {pwdMsg && <div className={p.alertSuccess}>{pwdMsg}</div>}
          {pwdErr && <div className={p.alertError}>{pwdErr}</div>}

          <form onSubmit={handleSavePwd}>

            <div className={p.field}>
              <label className={p.label}>Mot de passe actuel</label>
              <input
                className={p.input}
                style={inputStyle('current_password', savingPwd)}
                type="password"
                value={pwdForm.current_password}
                onChange={e => setPwdForm({...pwdForm, current_password: e.target.value})}
                onFocus={() => setFocusedField('current_password')}
                onBlur={() => setFocusedField(null)}
                disabled={savingPwd}
                placeholder="Votre mot de passe actuel"
                required
              />
            </div>

            <div className={p.field}>
              <label className={p.label}>Nouveau mot de passe</label>
              <input
                className={p.input}
                style={inputStyle('password', savingPwd)}
                type="password"
                value={pwdForm.password}
                onChange={e => setPwdForm({...pwdForm, password: e.target.value})}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                disabled={savingPwd}
                placeholder="Minimum 8 caractères"
                required
              />
            </div>

            <div className={p.field}>
              <label className={p.label}>Confirmer le mot de passe</label>
              <input
                className={p.input}
                style={inputStyle('password_confirmation', savingPwd)}
                type="password"
                value={pwdForm.password_confirmation}
                onChange={e => setPwdForm({...pwdForm, password_confirmation: e.target.value})}
                onFocus={() => setFocusedField('password_confirmation')}
                onBlur={() => setFocusedField(null)}
                disabled={savingPwd}
                placeholder="Répétez le mot de passe"
                required
              />
            </div>

            {/* Password strength hints */}
            <div className={p.pwdHints}>
              <div className={pwdForm.password.length >= 8 ? p.hintOk : p.hintPending}>
                {pwdForm.password.length >= 8 ? '✓' : '○'} Au moins 8 caractères
              </div>
              <div className={pwdForm.password && pwdForm.password === pwdForm.password_confirmation ? p.hintOk : p.hintPending}>
                {pwdForm.password && pwdForm.password === pwdForm.password_confirmation ? '✓' : '○'} Les mots de passe correspondent
              </div>
            </div>

            <div className={p.cardFooter}>
              <button type="submit" className={`btn-hover ${p.btnSave}`} disabled={savingPwd}>
                {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </Layout>
  )
}

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import p from './VerifyDocument.module.css'

/**
 * Page publique de vérification d'authenticité d'un document PDF
 * émis par le Portail RH ArabSoft.
 *
 * URL attendue : /verify?ref=REF-{id}-{année}&hash={hmac16}
 * Scannable via QR code depuis n'importe quel téléphone — aucune auth.
 */
export default function VerifyDocument() {
  const [params] = useSearchParams()
  const [state, setState] = useState({ loading: true, data: null })

  useEffect(() => {
    const ref  = params.get('ref')
    const hash = params.get('hash')

    if (!ref || !hash) {
      setState({ loading: false, data: { valid: false, reason: 'parametres_manquants' } })
      return
    }

    fetch(`http://127.0.0.1:8000/api/verify?ref=${encodeURIComponent(ref)}&hash=${encodeURIComponent(hash)}`)
      .then(r => r.json())
      .then(data => setState({ loading: false, data }))
      .catch(() => setState({ loading: false, data: { valid: false, reason: 'erreur_reseau' } }))
  }, [params])

  // Animation reveal en cascade après le chargement
  useEffect(() => {
    if (!state.loading) {
      const els = document.querySelectorAll('.reveal')
      els.forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 120 + i * 140)
      })
    }
  }, [state.loading])

  return (
    <div className={p.page}>
      <style>{globalCSS}</style>

      <header className={p.header}>
        <div className={p.logoBox}>A</div>
        <div>
          <div className={p.brandName}>ArabSoft</div>
          <div className={p.brandTagline}>Vérification d'authenticité</div>
        </div>
      </header>

      <main className={p.main}>
        {state.loading ? (
          <LoadingState />
        ) : state.data.valid ? (
          <ValidCard data={state.data} />
        ) : (
          <InvalidCard reason={state.data.reason} />
        )}
      </main>

      <footer className={p.footer}>
        <div>© {new Date().getFullYear()} ArabSoft — Direction des Ressources Humaines</div>
        <div style={{ opacity: 0.6, marginTop: 6 }}>
          Rue 8368, Montplaisir, 1073 Tunis — Tunisie · +216 71 95 12 48
        </div>
      </footer>
    </div>
  )
}

/* ================= LOADING ================= */
function LoadingState() {
  return (
    <div className={p.loadingWrap}>
      <div className={p.spinner} />
      <div className={p.loadingText}>Vérification en cours…</div>
    </div>
  )
}

/* ================= VALID ================= */
function ValidCard({ data }) {
  const emisLe   = data.emis_le   ? new Date(data.emis_le)   : null
  const expireLe = data.expire_le ? new Date(data.expire_le) : null

  return (
    <div className={p.card}>
      <div className={`reveal ${p.badgeValid}`}>
        <div className={p.checkCircle}>✓</div>
        <div>
          <div className={p.badgeTitle}>DOCUMENT AUTHENTIQUE</div>
          <div className={p.badgeSub}>Signature cryptographique vérifiée</div>
        </div>
      </div>

      <div className={`reveal ${p.refBar}`}>
        <span className={p.refLabel}>Référence</span>
        <span className={p.refValue}>{data.reference}</span>
      </div>

      <div className={`reveal ${p.sectionTitle}`}>Informations du document</div>

      <table className={`reveal ${p.table}`}>
        <tbody>
          <tr>
            <td className={p.tdLabel}>Type de document</td>
            <td className={p.tdValue}><strong>{data.type_document}</strong></td>
          </tr>
          <tr>
            <td className={p.tdLabel}>Bénéficiaire</td>
            <td className={p.tdValue}>
              {data.employee?.prenom} {data.employee?.nom}
            </td>
          </tr>
          <tr>
            <td className={p.tdLabel}>Poste</td>
            <td className={p.tdValue}>{data.employee?.poste || '—'}</td>
          </tr>
          <tr>
            <td className={p.tdLabel}>Département</td>
            <td className={p.tdValue}>{data.employee?.departement || '—'}</td>
          </tr>
          <tr>
            <td className={p.tdLabel}>Émis le</td>
            <td className={p.tdValue}>
              {emisLe ? emisLe.toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '—'}
            </td>
          </tr>
          <tr>
            <td className={p.tdLabel}>Valide jusqu'au</td>
            <td className={p.tdValue}>
              <strong style={{ color: '#22C55E' }}>
                {expireLe ? expireLe.toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '—'}
              </strong>
            </td>
          </tr>
          <tr>
            <td className={p.tdLabel}>Approuvé par</td>
            <td className={p.tdValue}>{data.approuve_par}</td>
          </tr>
        </tbody>
      </table>

      <div className={`reveal ${p.legalNote}`}>
        🔐 Ce document a été vérifié cryptographiquement via HMAC-SHA256.
        Toute altération du fichier PDF ou de la référence invalide cette signature.
        Pour toute question, contactez la Direction RH d'ArabSoft.
      </div>
    </div>
  )
}

/* ================= INVALID ================= */
function InvalidCard({ reason }) {
  const reasons = {
    format_invalide:      'Format de référence incorrect.',
    non_trouve:           "Aucun document n'a été trouvé avec cette référence.",
    hash_invalide:        'Signature invalide — le document a été altéré ou contrefait.',
    expire:               'Document expiré (la validité de 1 mois est dépassée).',
    parametres_manquants: "L'URL de vérification est incomplète ou corrompue.",
    erreur_reseau:        'Impossible de contacter le serveur de vérification.',
  }

  const message = reasons[reason] || 'Document non reconnu.'

  return (
    <div className={p.card}>
      <div className={`reveal ${p.badgeInvalid}`}>
        <div className={p.crossCircle}>✕</div>
        <div>
          <div className={p.badgeTitle}>DOCUMENT NON RECONNU</div>
          <div className={p.badgeSub}>Vérification échouée</div>
        </div>
      </div>

      <div className={`reveal ${p.errorBox}`}>
        <div className={p.errorLabel}>Motif :</div>
        <div className={p.errorText}>{message}</div>
      </div>

      <div className={`reveal ${p.helpBox}`}>
        <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 8 }}>
          Que faire ?
        </strong>
        Si vous pensez qu'il s'agit d'une erreur, contactez la Direction des
        Ressources Humaines d'ArabSoft aux coordonnées suivantes :
        <div style={{ marginTop: 10, lineHeight: 1.7 }}>
          📞 <strong>+216 71 95 12 48</strong><br />
          📧 <strong>arabsoft@arabsoft.com.tn</strong>
        </div>
      </div>
    </div>
  )
}

/* ================= Global CSS (reveal animations — must stay global) ================= */
const globalCSS = `
  body { margin: 0; }
  .reveal {
    opacity: 0;
    transform: translateY(14px);
    transition: opacity .6s cubic-bezier(.22,.61,.36,1), transform .6s cubic-bezier(.22,.61,.36,1);
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
`

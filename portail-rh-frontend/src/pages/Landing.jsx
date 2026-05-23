import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState, useMemo } from 'react'
import { useTheme } from '../context/ThemeContext'
import p from './Landing.module.css'

// ── Constellation d'équipe (canvas 2D) ──
function ParticleNetwork() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []

    const CONFIG = {
      particleCount: 70,
      maxDistance: 140,
      mouseRadius: 180,
      particleColor: 'rgba(255,45,32,0.55)',
      lineColor: 'var(--border)',
      mouseLineColor: 'rgba(255,45,32,0.35)',
      speed: 0.25,
    }

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    const initParticles = () => {
      const count = window.innerWidth < 768 ? 35 : CONFIG.particleCount
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * CONFIG.speed,
        vy: (Math.random() - 0.5) * CONFIG.speed,
        radius: Math.random() * 1.5 + 1,
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      particles.forEach(pt => {
        pt.x += pt.vx
        pt.y += pt.vy
        if (pt.x < 0 || pt.x > canvas.offsetWidth) pt.vx *= -1
        if (pt.y < 0 || pt.y > canvas.offsetHeight) pt.vy *= -1

        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2)
        ctx.fillStyle = CONFIG.particleColor
        ctx.fill()
      })

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONFIG.maxDistance) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = CONFIG.lineColor
            ctx.globalAlpha = 1 - dist / CONFIG.maxDistance
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      particles.forEach(pt => {
        const dx = pt.x - mouseRef.current.x
        const dy = pt.y - mouseRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONFIG.mouseRadius) {
          ctx.beginPath()
          ctx.moveTo(pt.x, pt.y)
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y)
          ctx.strokeStyle = CONFIG.mouseLineColor
          ctx.globalAlpha = 1 - dist / CONFIG.mouseRadius
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      })

      animationId = requestAnimationFrame(draw)
    }

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
    }
    const handleLeave = () => {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }
    const handleResize = () => { resize(); initParticles() }

    resize()
    initParticles()
    draw()
    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouse)
    canvas.addEventListener('mouseleave', handleLeave)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouse)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 1,
      }}
    />
  )
}

// ── Compteur animé déclenché par IntersectionObserver ──
function AnimatedCounter({ value, duration = 1800 }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef(null)
  const startedRef = useRef(false)

  const parsed = useMemo(() => {
    const match = String(value).match(/^(\d+)(.*)$/)
    if (!match) return { text: value }
    return { number: parseInt(match[1]), suffix: match[2] }
  }, [value])

  useEffect(() => {
    if (parsed.text !== undefined) { setDisplay(parsed.text); return }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true
          const start = performance.now()
          const animate = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 4)
            setDisplay(Math.floor(parsed.number * eased) + parsed.suffix)
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [parsed, duration])

  return <span ref={ref}>{display}</span>
}

export default function Landing() {
  const navigate = useNavigate()
  const { mode, toggle } = useTheme()

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav className={p.nav}>
        <a href="#" className={p.navLogo}>
          <div className={p.navMark}>A</div>
          <span className={p.navName}>Arab<span style={{color:'var(--accent)'}}>Soft</span></span>
        </a>
        <div className={p.navLinks}>
          <a href="#features" className={p.navLink}>Fonctionnalités</a>
          <a href="#about" className={p.navLink}>À propos</a>
          <a href="#roles" className={p.navLink}>Rôles</a>
        </div>
        <div className={p.navActions}>
          <button
            onClick={toggle}
            title={mode === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            className={p.themeBtn}
          >
            {mode === 'dark' ? '☀️' : '🌙'}
          </button>
          <a href="https://www.arabsoft.com.tn" target="_blank" rel="noreferrer" className={p.btnGhost}>
            Site officiel ↗
          </a>
          <button onClick={() => navigate('/login')} className={p.btnRed}>
            Accéder au portail →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className={p.hero}>
        <div className={p.heroBg} />
        <ParticleNetwork />
        <div className={p.heroDots} />
        <div className={p.heroContent}>
          <div className={p.eyebrow}>
            <div className={p.eyebrowPip}>🏢</div>
            ArabSoft — Solution RH Digitale 2026
          </div>
          <h1 className={p.h1}>
            Le portail RH conçu<br/>
            pour les <em style={{fontStyle:'italic',color:'var(--accent)'}}>équipes</em><br/>
            de votre entreprise.
          </h1>
          <p className={p.heroSub}>
            Centralisez toutes vos demandes RH en un seul espace sécurisé.
            Congés, prêts, autorisations et documents — traités avec rapidité.
          </p>
          <div className={p.heroActions}>
            <button onClick={() => navigate('/login')} className={p.btnLgRed}>
              Accéder au portail →
            </button>
            <a href="#features" className={p.btnLgGhost}>
              Voir les fonctionnalités
            </a>
          </div>
        </div>
      </section>

      {/* STATS DIVIDER */}
      <div className={p.divider}>
        <span className={p.dividerLabel}>ArabSoft en chiffres</span>
        <div className={p.dividerSep}/>
        {[
          ['1985','Fondée'],['150+','Employés'],['30+','Ans d\'expérience'],['ISO 9001','Certifiée'],['5','Modules RH']
        ].map(([num, label]) => (
          <div key={num} className={p.statItem}>
            <span className={p.statNum}>
              <AnimatedCounter value={num} />
            </span>
            {label}
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" className={p.secSurface}>
        <div className={`reveal ${p.secCenter}`}>
          <div className={p.secLbl}>Fonctionnalités</div>
          <div className={p.secH}>Tout ce dont vous avez besoin<br/>pour gérer vos <em style={{fontStyle:'italic',color:'var(--accent)'}}>Ressources Humaines</em></div>
          <p className={p.secPCenter}>Cinq modules complets pour digitaliser toutes vos demandes administratives.</p>
        </div>
        <div className="reveal reveal-stagger">
          <div className={p.featGrid}>
            {features.map((f, i) => (
              <div key={i} className={p.featCell}>
                <div className={p.featN}>0{i+1}</div>
                <div className={p.featIco} style={{background: f.bg}}>{f.icon}</div>
                <div className={p.featT}>{f.title}</div>
                <p className={p.featD}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className={p.sec}>
        <div className={p.split}>
          <div className="reveal">
            <div className={p.secLbl}>À propos d'ArabSoft</div>
            <div className={p.secH}>Plus de <em style={{fontStyle:'italic',color:'var(--accent)'}}>30 ans</em><br/>d'expertise en gestion RH</div>
            <p className={`${p.secP}`} style={{marginBottom:'36px'}}>
              Fondée en 1985 par Mohamed TRIKI, ArabSoft s'est spécialisée dans l'édition de solutions de gestion pour le secteur public et privé.
            </p>
            {highlights.map((h, i) => (
              <div key={i} className={p.hlItem}>
                <div className={p.hlIco} style={{background: h.bg}}>{h.icon}</div>
                <div><div className={p.hlT}>{h.title}</div><div className={p.hlD}>{h.desc}</div></div>
              </div>
            ))}
          </div>
          <div className="reveal" style={{transitionDelay:'0.2s'}}>
            <div className={p.aboutCard}>
              <div className={p.acHead}>
                <div className={p.acMark}>A</div>
                <div>
                  <div className={p.acName}>Arab<span style={{color:'var(--accent)'}}>Soft</span></div>
                  <div className={p.acSub}>Édition de logiciel · Tunis, Tunisie</div>
                </div>
              </div>
              <div>
                {aboutRows.map(([k, v, red]) => (
                  <div key={k} className={p.acRow}>
                    <span className={p.acRowKey}>{k}</span>
                    <span className={red ? p.acRowValRed : p.acRowVal}>{v}</span>
                  </div>
                ))}
              </div>
              <div className={p.acFoot}>
                <div className={p.isoPill}>✓ ISO 9001 depuis 2008</div>
                <a href="https://www.arabsoft.com.tn" target="_blank" rel="noreferrer" style={{fontSize:'12px',color:'var(--text2)',textDecoration:'none'}}>arabsoft.com.tn ↗</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" style={{padding:'96px 48px',background:'var(--surface)',borderTop:'1px solid var(--border)'}}>
        <div className={`reveal ${p.secCenter}`}>
          <div className={p.secLbl}>Acteurs</div>
          <div className={p.secH}>3 rôles, <em style={{fontStyle:'italic',color:'var(--accent)'}}>1 portail</em></div>
          <p className={p.secPCenter}>Chaque acteur dispose d'un espace personnalisé adapté à ses responsabilités.</p>
        </div>
        <div className="reveal reveal-stagger">
          <div className={p.rolesGrid}>
            {roles.map((r, i) => (
              <div key={i} className={p.roleCard}>
                <div className={p.roleCardTop}>
                  <div className={p.rcIco} style={{background: r.bg}}>{r.icon}</div>
                  <div className={p.rcName}>{r.name}</div>
                  <div className={p.rcDesc}>{r.desc}</div>
                </div>
                <div className={p.roleCardBottom}>
                  {r.perms.map((perm, j) => (
                    <div key={j} className={p.rcPermRow}>
                      <div className={`${p.rcCk} ${perm.ok ? p.rcCkOk : p.rcCkNo}`}>{perm.ok ? '✓' : '✗'}</div>
                      {perm.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={p.cta}>
        <div className={`reveal ${p.ctaInner}`}>
          <div className={p.ctaPill}>🚀 Portail RH — ArabSoft 2026</div>
          <h2 className={p.ctaH}>Prêt à accéder<br/>à votre <em style={{fontStyle:'italic',color:'#FF6B63'}}>espace RH</em> ?</h2>
          <p className={p.ctaSub}>
            Connectez-vous avec vos identifiants ArabSoft et gérez toutes vos demandes.
          </p>
          <div className={p.ctaActions}>
            <button onClick={() => navigate('/login')} className={p.btnLgRed}>Accéder au Portail RH →</button>
            <a href="https://www.arabsoft.com.tn" target="_blank" rel="noreferrer" className={p.btnCtaGhost}>Site ArabSoft ↗</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={p.footer}>
        <div className={p.ftGrid}>
          <div>
            <div className={p.navLogo}>
              <div className={p.navMark}>A</div>
              <span className={p.navName}>Arab<span style={{color:'var(--accent)'}}>Soft</span></span>
            </div>
            <p className={p.ftAbout}>
              Éditeur de logiciels de gestion depuis 1985. Certifié ISO 9001. Notre mission : digitaliser la gestion RH en Tunisie.
            </p>
          </div>
          {footerCols.map((col, i) => (
            <div key={i}>
              <div className={p.ftColH}>{col.title}</div>
              <ul className={p.ftLinks}>
                {col.links.map((l, j) => (
                  <li key={j}><a href={l.href} target={l.ext ? '_blank' : '_self'} rel="noreferrer" className={p.ftLink}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={p.ftBottom}>
          <span>© 2026 ArabSoft. Tous droits réservés.</span>
          <div className={p.ftPfe}>🎓 PFE ISTIC — Université de Carthage 2026</div>
        </div>
      </footer>

      <style>{revealCSS}</style>
    </>
  )
}

// ── DATA ──
const features = [
  { icon:'🏖️', title:'Demandes de congé', desc:'Soumettez congés annuels, maladie ou exceptionnels. Consultez votre solde restant en temps réel.', bg:'rgba(255,45,32,0.12)' },
  { icon:'💰', title:'Prêts & Avances', desc:'Demandez des prêts personnels ou avances avec durée de 3 à 24 mois. Suivi intégré.', bg:'rgba(249,115,22,0.12)' },
  { icon:'📄', title:'Documents administratifs', desc:'Attestations, bulletins de paie, certificats — obtenez vos documents sans vous déplacer.', bg:'rgba(34,197,94,0.12)' },
  { icon:'🚪', title:'Autorisations de sortie', desc:'Demandez des autorisations de sortie anticipée validées par votre chef hiérarchique.', bg:'rgba(139,92,246,0.12)' },
  { icon:'👤', title:'Changement de situation', desc:'Déclarez vos changements d\'état civil directement depuis votre espace personnel sécurisé.', bg:'rgba(59,130,246,0.12)' },
  { icon:'🤖', title:'Assistant IA — Gemini', desc:'Réponses instantanées à vos questions RH grâce à notre assistant Gemini AI, 24h/7j.', bg:'rgba(147,51,234,0.12)' },
]

const highlights = [
  { icon:'🔐', title:'Sécurité JWT & RGPD', desc:'Authentification par token JWT. Données protégées conformément à la loi organique n°2004-63.', bg:'rgba(255,45,32,0.12)' },
  { icon:'⚡', title:'Workflow multi-niveaux', desc:'Validation structurée : employé → chef → gestionnaire RH, avec validation directe si nécessaire.', bg:'rgba(59,130,246,0.12)' },
  { icon:'🤖', title:'Intelligence Artificielle Gemini', desc:'Assistant IA intégré pour répondre instantanément aux questions RH du personnel, 24h/7j.', bg:'rgba(147,51,234,0.12)' },
]

const aboutRows = [
  ['Fondée en', '1985 — Mohamed TRIKI', false],
  ['Spécialité', 'Édition de logiciels de gestion', false],
  ['Adresse', 'Rue 8368, Montplaisir, 1073 Tunis', false],
  ['Téléphone', '+216 71 95 12 48', false],
  ['Email', 'arabsoft@arabsoft.com.tn', false],
  ['Solution RH', 'AJIR — Portail RH Digitale', true],
]

const roles = [
  { icon:'👤', name:'Employé', desc:'Personnel de l\'entreprise. Gère ses propres demandes RH.', bg:'rgba(59,130,246,0.12)',
    perms:[{ok:true,text:'Soumettre des demandes RH'},{ok:true,text:'Suivre ses propres demandes'},{ok:true,text:'Consulter son solde de congés'},{ok:true,text:'Accéder à ses documents'},{ok:false,text:'Voir les dossiers des autres'}]},
  { icon:'👔', name:'Chef Hiérarchique', desc:'Responsable d\'équipe. Valide congés et autorisations.', bg:'rgba(255,45,32,0.12)',
    perms:[{ok:true,text:'Valider congés & autorisations'},{ok:true,text:'Voir les demandes de son équipe'},{ok:true,text:'Approuver ou refuser'},{ok:true,text:'Tableau de bord équipe'},{ok:false,text:'Accès aux données financières'}]},
  { icon:'🛡️', name:'Administrateur RH', desc:'Gestionnaire RH. Accès complet à toutes les fonctionnalités.', bg:'rgba(34,197,94,0.12)',
    perms:[{ok:true,text:'Accès total à toutes les demandes'},{ok:true,text:'Validation directe sans chef'},{ok:true,text:'Gestion des profils employés'},{ok:true,text:'Dashboard analytique complet'},{ok:true,text:'Ajout / suppression d\'utilisateurs'}]},
]

const footerCols = [
  { title:'Portail RH', links:[{label:'Tableau de bord',href:'#'},{label:'Mes Demandes',href:'#'},{label:'Assistant IA',href:'#'},{label:'Mon Profil',href:'#'}]},
  { title:'ArabSoft', links:[{label:'Site officiel',href:'https://www.arabsoft.com.tn',ext:true},{label:'Solution AJIR',href:'https://www.arabsoft.com.tn/ajir',ext:true},{label:'À propos',href:'https://www.arabsoft.com.tn/a-propos',ext:true},{label:'Contact',href:'https://www.arabsoft.com.tn/contactez-nous1',ext:true}]},
  { title:'Contact', links:[{label:'Montplaisir, 1073 Tunis',href:'#'},{label:'+216 71 95 12 48',href:'tel:+21671951248'},{label:'arabsoft@arabsoft.com.tn',href:'mailto:arabsoft@arabsoft.com.tn'}]},
]

const revealCSS = `
  .reveal { opacity:0; transform:translateY(24px); transition:opacity 0.65s ease, transform 0.65s ease; }
  .reveal.visible { opacity:1; transform:translateY(0); }

  .reveal-stagger > * {
    opacity:0;
    transform:translateY(24px);
    transition:opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal-stagger.visible > *:nth-child(1) { opacity:1; transform:translateY(0); transition-delay:0.00s; }
  .reveal-stagger.visible > *:nth-child(2) { opacity:1; transform:translateY(0); transition-delay:0.08s; }
  .reveal-stagger.visible > *:nth-child(3) { opacity:1; transform:translateY(0); transition-delay:0.16s; }
  .reveal-stagger.visible > *:nth-child(4) { opacity:1; transform:translateY(0); transition-delay:0.24s; }
  .reveal-stagger.visible > *:nth-child(5) { opacity:1; transform:translateY(0); transition-delay:0.32s; }
  .reveal-stagger.visible > *:nth-child(6) { opacity:1; transform:translateY(0); transition-delay:0.40s; }
`

import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Landing() {
  const navigate = useNavigate()

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
      <nav style={styles.nav}>
        <a href="#" style={styles.navLogo}>
          <div style={styles.navMark}>A</div>
          <span style={styles.navName}>Arab<span style={{color:'var(--accent)'}}>Soft</span></span>
        </a>
        <div style={{display:'flex',gap:'2px'}}>
          <a href="#features" style={styles.navLink}>Fonctionnalités</a>
          <a href="#about" style={styles.navLink}>À propos</a>
          <a href="#roles" style={styles.navLink}>Rôles</a>
        </div>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <a href="https://www.arabsoft.com.tn" target="_blank" rel="noreferrer" style={styles.btnGhost}>
            Site officiel ↗
          </a>
          <button onClick={() => navigate('/login')} style={styles.btnRed}>
            Accéder au portail →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroBg} />
        <div style={styles.heroDots} />
        <div style={styles.heroContent}>
          <div style={styles.eyebrow}>
            <div style={styles.eyebrowPip}>🏢</div>
            ArabSoft — Solution RH Digitale 2026
          </div>
          <h1 style={styles.h1}>
            Le portail RH conçu<br/>
            pour les <em style={{fontStyle:'italic',color:'var(--accent)'}}>artisans</em><br/>
            de votre entreprise.
          </h1>
          <p style={styles.heroSub}>
            Centralisez toutes vos demandes RH en un seul espace sécurisé.
            Congés, prêts, autorisations et documents — traités avec rapidité.
          </p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={() => navigate('/login')} style={styles.btnLgRed}>
              Accéder au portail →
            </button>
            <a href="#features" style={styles.btnLgGhost}>
              Voir les fonctionnalités
            </a>
          </div>
        </div>
      </section>

      {/* STATS DIVIDER */}
      <div style={styles.divider}>
        <span style={{fontSize:'13px',color:'var(--text3)'}}>ArabSoft en chiffres</span>
        <div style={{width:'1px',height:'20px',background:'var(--border)'}}/>
        {[
          ['1985','Fondée'],['150+','Employés'],['30+','Ans d\'expérience'],['ISO 9001','Certifiée'],['5','Modules RH']
        ].map(([num, label]) => (
          <div key={num} style={{display:'flex',alignItems:'baseline',gap:'6px',fontSize:'14px',color:'var(--text2)'}}>
            <span style={{fontFamily:'Instrument Serif, serif',fontSize:'22px',color:'var(--text)'}}>{num}</span>
            {label}
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" style={{...styles.sec, background:'var(--surface)', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)'}}>
        <div className="reveal" style={{textAlign:'center',marginBottom:'64px'}}>
          <div style={styles.secLbl}>Fonctionnalités</div>
          <div style={styles.secH}>Tout ce dont vous avez besoin<br/>pour gérer vos <em style={{fontStyle:'italic',color:'var(--accent)'}}>Ressources Humaines</em></div>
          <p style={{...styles.secP,margin:'0 auto'}}>Cinq modules complets pour digitaliser toutes vos demandes administratives.</p>
        </div>
        <div className="reveal" style={styles.featGrid}>
          {features.map((f, i) => (
            <div key={i} style={styles.featCell}>
              <div style={styles.featN}>0{i+1}</div>
              <div style={{...styles.featIco, background: f.bg}}>{f.icon}</div>
              <div style={styles.featT}>{f.title}</div>
              <p style={styles.featD}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{...styles.sec, background:'var(--white)'}}>
        <div style={styles.split}>
          <div className="reveal">
            <div style={styles.secLbl}>À propos d'ArabSoft</div>
            <div style={styles.secH}>Plus de <em style={{fontStyle:'italic',color:'var(--accent)'}}>30 ans</em><br/>d'expertise en gestion RH</div>
            <p style={{...styles.secP, marginBottom:'36px'}}>
              Fondée en 1985 par Mohamed TRIKI, ArabSoft s'est spécialisée dans l'édition de solutions de gestion pour le secteur public et privé.
            </p>
            {highlights.map((h, i) => (
              <div key={i} style={styles.hlItem}>
                <div style={{...styles.hlIco, background: h.bg}}>{h.icon}</div>
                <div><div style={styles.hlT}>{h.title}</div><div style={styles.hlD}>{h.desc}</div></div>
              </div>
            ))}
          </div>
          <div className="reveal" style={{transitionDelay:'0.2s'}}>
            <div style={styles.aboutCard}>
              <div style={styles.acHead}>
                <div style={styles.acMark}>A</div>
                <div>
                  <div style={styles.acName}>Arab<span style={{color:'var(--accent)'}}>Soft</span></div>
                  <div style={{fontSize:'11px',color:'#71717A'}}>Édition de logiciel · Tunis, Tunisie</div>
                </div>
              </div>
              <div>
                {aboutRows.map(([k, v, red]) => (
                  <div key={k} style={styles.acRow}>
                    <span style={{color:'var(--text2)'}}>{k}</span>
                    <span style={{color: red ? 'var(--accent)' : 'var(--text)', fontWeight:500, textAlign:'right'}}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={styles.acFoot}>
                <div style={styles.isoPill}>✓ ISO 9001 depuis 2008</div>
                <a href="https://www.arabsoft.com.tn" target="_blank" rel="noreferrer" style={{fontSize:'12px',color:'var(--text2)',textDecoration:'none'}}>arabsoft.com.tn ↗</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" style={{...styles.sec, background:'var(--surface)', borderTop:'1px solid var(--border)'}}>
        <div className="reveal" style={{textAlign:'center',marginBottom:'64px'}}>
          <div style={styles.secLbl}>Acteurs</div>
          <div style={styles.secH}>3 rôles, <em style={{fontStyle:'italic',color:'var(--accent)'}}>1 portail</em></div>
          <p style={{...styles.secP,margin:'0 auto'}}>Chaque acteur dispose d'un espace personnalisé adapté à ses responsabilités.</p>
        </div>
        <div className="reveal" style={styles.rolesGrid}>
          {roles.map((r, i) => (
            <div key={i} style={styles.roleCard}>
              <div style={{padding:'26px 26px 18px', borderBottom:'1px solid var(--border)'}}>
                <div style={{...styles.rcIco, background: r.bg}}>{r.icon}</div>
                <div style={styles.rcName}>{r.name}</div>
                <div style={styles.rcDesc}>{r.desc}</div>
              </div>
              <div style={{padding:'18px 26px',display:'flex',flexDirection:'column',gap:'10px'}}>
                {r.perms.map((p, j) => (
                  <div key={j} style={{display:'flex',alignItems:'center',gap:'10px',fontSize:'13px',color:'var(--text2)'}}>
                    <div style={{...styles.rcCk, ...(p.ok ? styles.rcCkOk : styles.rcCkNo)}}>{p.ok ? '✓' : '✗'}</div>
                    {p.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <div className="reveal" style={{position:'relative',zIndex:2,maxWidth:'600px',margin:'0 auto',textAlign:'center'}}>
          <div style={styles.ctaPill}>🚀 Portail RH — ArabSoft 2026</div>
          <h2 style={styles.ctaH}>Prêt à accéder<br/>à votre <em style={{fontStyle:'italic',color:'#FF6B63'}}>espace RH</em> ?</h2>
          <p style={{fontSize:'16px',color:'#A1A1AA',marginBottom:'40px',lineHeight:1.6}}>
            Connectez-vous avec vos identifiants ArabSoft et gérez toutes vos demandes.
          </p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <button onClick={() => navigate('/login')} style={styles.btnLgRed}>Accéder au Portail RH →</button>
            <a href="https://www.arabsoft.com.tn" target="_blank" rel="noreferrer" style={styles.btnCtaGhost}>Site ArabSoft ↗</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.ftGrid}>
          <div>
            <div style={styles.navLogo}>
              <div style={styles.navMark}>A</div>
              <span style={styles.navName}>Arab<span style={{color:'var(--accent)'}}>Soft</span></span>
            </div>
            <p style={{fontSize:'13.5px',color:'var(--text2)',lineHeight:1.7,marginTop:'14px',maxWidth:'280px'}}>
              Éditeur de logiciels de gestion depuis 1985. Certifié ISO 9001. Notre mission : digitaliser la gestion RH en Tunisie.
            </p>
          </div>
          {footerCols.map((col, i) => (
            <div key={i}>
              <div style={styles.ftColH}>{col.title}</div>
              <ul style={{listStyle:'none',display:'flex',flexDirection:'column',gap:'10px'}}>
                {col.links.map((l, j) => (
                  <li key={j}><a href={l.href} target={l.ext ? '_blank' : '_self'} rel="noreferrer" style={styles.ftLink}>{l.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={styles.ftBottom}>
          <span>© 2026 ArabSoft. Tous droits réservés.</span>
          <div style={styles.ftPfe}>🎓 PFE ISTIC — Université de Carthage 2026</div>
        </div>
      </footer>

      <style>{revealCSS}</style>
    </>
  )
}

// ── DATA ──
const features = [
  { icon:'🏖️', title:'Demandes de congé', desc:'Soumettez congés annuels, maladie ou exceptionnels. Consultez votre solde restant en temps réel.', bg:'#FFF1F0' },
  { icon:'💰', title:'Prêts & Avances', desc:'Demandez des prêts personnels ou avances avec durée de 3 à 24 mois. Suivi intégré.', bg:'#FFF7ED' },
  { icon:'📄', title:'Documents administratifs', desc:'Attestations, bulletins de paie, certificats — obtenez vos documents sans vous déplacer.', bg:'#F0FDF4' },
  { icon:'🚪', title:'Autorisations de sortie', desc:'Demandez des autorisations de sortie anticipée validées par votre chef hiérarchique.', bg:'#F5F3FF' },
  { icon:'👤', title:'Changement de situation', desc:'Déclarez vos changements d\'état civil directement depuis votre espace personnel sécurisé.', bg:'#EFF6FF' },
  { icon:'🤖', title:'Assistant IA — Gemini', desc:'Réponses instantanées à vos questions RH grâce à notre assistant Gemini AI, 24h/7j.', bg:'#FDF4FF' },
]

const highlights = [
  { icon:'🔐', title:'Sécurité JWT & RGPD', desc:'Authentification par token JWT. Données protégées conformément à la loi organique n°2004-63.', bg:'#FFF1F0' },
  { icon:'⚡', title:'Workflow multi-niveaux', desc:'Validation structurée : employé → chef → gestionnaire RH, avec validation directe si nécessaire.', bg:'#EFF6FF' },
  { icon:'🤖', title:'Intelligence Artificielle Gemini', desc:'Assistant IA intégré pour répondre instantanément aux questions RH du personnel, 24h/7j.', bg:'#FDF4FF' },
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
  { icon:'👤', name:'Employé', desc:'Personnel de l\'entreprise. Gère ses propres demandes RH.', bg:'#EFF6FF',
    perms:[{ok:true,text:'Soumettre des demandes RH'},{ok:true,text:'Suivre ses propres demandes'},{ok:true,text:'Consulter son solde de congés'},{ok:true,text:'Accéder à ses documents'},{ok:false,text:'Voir les dossiers des autres'}]},
  { icon:'👔', name:'Chef Hiérarchique', desc:'Responsable d\'équipe. Valide congés et autorisations.', bg:'#FFF1F0',
    perms:[{ok:true,text:'Valider congés & autorisations'},{ok:true,text:'Voir les demandes de son équipe'},{ok:true,text:'Approuver ou refuser'},{ok:true,text:'Tableau de bord équipe'},{ok:false,text:'Accès aux données financières'}]},
  { icon:'🛡️', name:'Administrateur RH', desc:'Gestionnaire RH. Accès complet à toutes les fonctionnalités.', bg:'#F0FDF4',
    perms:[{ok:true,text:'Accès total à toutes les demandes'},{ok:true,text:'Validation directe sans chef'},{ok:true,text:'Gestion des profils employés'},{ok:true,text:'Dashboard analytique complet'},{ok:true,text:'Ajout / suppression d\'utilisateurs'}]},
]

const footerCols = [
  { title:'Portail RH', links:[{label:'Tableau de bord',href:'#'},{label:'Mes Demandes',href:'#'},{label:'Assistant IA',href:'#'},{label:'Mon Profil',href:'#'}]},
  { title:'ArabSoft', links:[{label:'Site officiel',href:'https://www.arabsoft.com.tn',ext:true},{label:'Solution AJIR',href:'https://www.arabsoft.com.tn/ajir',ext:true},{label:'À propos',href:'https://www.arabsoft.com.tn/a-propos',ext:true},{label:'Contact',href:'https://www.arabsoft.com.tn/contactez-nous1',ext:true}]},
  { title:'Contact', links:[{label:'Montplaisir, 1073 Tunis',href:'#'},{label:'+216 71 95 12 48',href:'tel:+21671951248'},{label:'arabsoft@arabsoft.com.tn',href:'mailto:arabsoft@arabsoft.com.tn'}]},
]

// ── STYLES ──
const styles = {
  nav:{position:'fixed',top:0,left:0,right:0,zIndex:100,height:'64px',background:'rgba(255,255,255,0.92)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',padding:'0 48px',justifyContent:'space-between'},
  navLogo:{display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'},
  navMark:{width:'32px',height:'32px',background:'var(--accent)',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:'15px',fontFamily:'Instrument Serif, serif',fontStyle:'italic'},
  navName:{fontSize:'16px',fontWeight:600,color:'var(--text)',letterSpacing:'-0.3px'},
  navLink:{padding:'6px 14px',fontSize:'14px',color:'var(--text2)',textDecoration:'none',borderRadius:'8px',fontWeight:500},
  btnGhost:{padding:'7px 16px',fontSize:'14px',color:'var(--text2)',background:'none',border:'1px solid var(--border2)',borderRadius:'8px',cursor:'pointer',fontWeight:500,textDecoration:'none'},
  btnRed:{padding:'7px 18px',fontSize:'14px',background:'var(--accent)',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:500},
  hero:{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'120px 48px 80px',position:'relative',overflow:'hidden',background:'var(--white)'},
  heroBg:{position:'absolute',inset:0,background:'radial-gradient(ellipse 70% 50% at 20% 20%, rgba(255,45,32,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 80% 80%, rgba(59,130,246,0.04) 0%, transparent 60%)'},
  heroDots:{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)',backgroundSize:'30px 30px',maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)'},
  heroContent:{position:'relative',zIndex:2,maxWidth:'840px'},
  eyebrow:{display:'inline-flex',alignItems:'center',gap:'8px',background:'var(--accent-light)',border:'1px solid rgba(255,45,32,0.2)',borderRadius:'100px',padding:'5px 16px 5px 8px',fontSize:'12.5px',fontWeight:500,color:'var(--accent)',marginBottom:'32px'},
  eyebrowPip:{width:'20px',height:'20px',background:'var(--accent)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px'},
  h1:{fontFamily:'Instrument Serif, serif',fontSize:'clamp(50px, 7vw, 86px)',fontWeight:400,lineHeight:1.05,letterSpacing:'-2.5px',color:'var(--text)',marginBottom:'24px'},
  heroSub:{fontSize:'18px',color:'var(--text2)',maxWidth:'500px',margin:'0 auto 44px',lineHeight:1.7},
  btnLgRed:{display:'inline-flex',alignItems:'center',gap:'8px',background:'var(--accent)',color:'white',border:'none',borderRadius:'10px',padding:'13px 28px',fontSize:'15px',fontWeight:500,cursor:'pointer',textDecoration:'none',boxShadow:'0 4px 14px rgba(255,45,32,0.25)'},
  btnLgGhost:{display:'inline-flex',alignItems:'center',gap:'8px',background:'white',color:'var(--text)',border:'1px solid var(--border2)',borderRadius:'10px',padding:'13px 24px',fontSize:'15px',fontWeight:500,textDecoration:'none',boxShadow:'var(--shadow-sm)'},
  divider:{borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',background:'white',padding:'28px 48px',display:'flex',alignItems:'center',justifyContent:'center',gap:'24px',flexWrap:'wrap'},
  sec:{padding:'96px 48px'},
  secLbl:{fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'1.5px',color:'var(--accent)',marginBottom:'12px'},
  secH:{fontFamily:'Instrument Serif, serif',fontSize:'clamp(36px,4vw,52px)',fontWeight:400,letterSpacing:'-1px',lineHeight:1.1,color:'var(--text)',marginBottom:'16px'},
  secP:{fontSize:'16px',color:'var(--text2)',maxWidth:'480px',lineHeight:1.7},
  featGrid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1px',background:'var(--border)',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden'},
  featCell:{background:'white',padding:'36px'},
  featN:{fontFamily:'Instrument Serif, serif',fontSize:'13px',color:'var(--text3)',marginBottom:'18px',fontStyle:'italic'},
  featIco:{width:'44px',height:'44px',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',marginBottom:'14px'},
  featT:{fontSize:'16px',fontWeight:600,color:'var(--text)',marginBottom:'10px'},
  featD:{fontSize:'14px',color:'var(--text2)',lineHeight:1.65},
  split:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'80px',alignItems:'center'},
  hlItem:{display:'flex',gap:'14px',padding:'18px',background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius)',marginBottom:'14px'},
  hlIco:{width:'40px',height:'40px',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0},
  hlT:{fontSize:'14px',fontWeight:600,marginBottom:'4px'},
  hlD:{fontSize:'13px',color:'var(--text2)',lineHeight:1.5},
  aboutCard:{background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden',boxShadow:'var(--shadow)'},
  acHead:{background:'#18181B',padding:'24px 28px',display:'flex',alignItems:'center',gap:'12px'},
  acMark:{width:'38px',height:'38px',background:'var(--accent)',borderRadius:'9px',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Instrument Serif, serif',fontStyle:'italic',fontSize:'18px',color:'white'},
  acName:{fontFamily:'Instrument Serif, serif',fontSize:'20px',fontWeight:400,color:'white'},
  acRow:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'14px 28px',borderBottom:'1px solid var(--border)',fontSize:'14px'},
  acFoot:{background:'var(--surface)',borderTop:'1px solid var(--border)',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between'},
  isoPill:{display:'inline-flex',alignItems:'center',gap:'6px',background:'var(--green-light)',border:'1px solid rgba(34,197,94,0.2)',color:'#16A34A',padding:'5px 12px',borderRadius:'100px',fontSize:'12px',fontWeight:500},
  rolesGrid:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'20px'},
  roleCard:{background:'white',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',overflow:'hidden',boxShadow:'var(--shadow-sm)'},
  rcIco:{width:'46px',height:'46px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',marginBottom:'14px'},
  rcName:{fontSize:'17px',fontWeight:600,letterSpacing:'-0.3px',marginBottom:'6px'},
  rcDesc:{fontSize:'13px',color:'var(--text2)',lineHeight:1.5},
  rcCk:{width:'18px',height:'18px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'9px',flexShrink:0},
  rcCkOk:{background:'var(--green-light)',color:'var(--green)',border:'1px solid rgba(34,197,94,0.25)'},
  rcCkNo:{background:'#FFF1F0',color:'var(--accent)',border:'1px solid rgba(255,45,32,0.2)'},
  cta:{padding:'96px 48px',background:'#18181B',position:'relative',overflow:'hidden',textAlign:'center'},
  ctaPill:{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(255,45,32,0.15)',border:'1px solid rgba(255,45,32,0.25)',color:'#FF6B63',borderRadius:'100px',padding:'4px 14px',fontSize:'12px',fontWeight:500,marginBottom:'28px'},
  ctaH:{fontFamily:'Instrument Serif, serif',fontSize:'clamp(36px,4.5vw,56px)',fontWeight:400,color:'white',letterSpacing:'-1px',lineHeight:1.1,marginBottom:'16px'},
  btnCtaGhost:{display:'inline-flex',alignItems:'center',background:'rgba(255,255,255,0.07)',color:'white',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'10px',padding:'13px 24px',fontSize:'15px',fontWeight:500,textDecoration:'none'},
  footer:{background:'white',borderTop:'1px solid var(--border)',padding:'56px 48px 32px'},
  ftGrid:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'48px',marginBottom:'48px',paddingBottom:'48px',borderBottom:'1px solid var(--border)'},
  ftColH:{fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',color:'var(--text3)',marginBottom:'16px'},
  ftLink:{fontSize:'14px',color:'var(--text2)',textDecoration:'none'},
  ftBottom:{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:'13px',color:'var(--text3)'},
  ftPfe:{display:'inline-flex',alignItems:'center',gap:'6px',background:'var(--accent-light)',border:'1px solid rgba(255,45,32,0.15)',color:'var(--accent)',padding:'4px 12px',borderRadius:'100px',fontSize:'12px',fontWeight:500},
}

const revealCSS = `
  .reveal { opacity:0; transform:translateY(24px); transition:opacity 0.65s ease,transform 0.65s ease; }
  .reveal.visible { opacity:1; transform:translateY(0); }
`
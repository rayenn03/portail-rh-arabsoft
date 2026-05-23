# CLAUDE.md — Portail RH ArabSoft

## Contexte du projet

Projet PFE (Fin d'Études) — ISTIC, Université de Carthage 2026  
Étudiant : Rayen — GLSI 3ème année  
Entreprise : ArabSoft, Tunis, Tunisie  
Sujet : Élaboration d'un Portail RH digital

---

## Stack Technique

### Backend
- **Framework** : Laravel 12 (PHP 8.2)
- **Base de données** : PostgreSQL 17 (port 5432)
- **Authentification** : JWT (tymon/jwt-auth 2.3.0)
- **Serveur local** : XAMPP (php artisan serve → port 8000)

### Frontend
- **Framework** : React.js + Vite
- **Router** : React Router DOM
- **HTTP Client** : Axios
- **Style** : CSS-in-JS (inline styles), variables CSS globales
- **Fonts** : Instrument Serif + Inter (Google Fonts)
- **Thème** : Light theme, accent rouge #FF2D20 (inspiré Laravel.com)
- **Serveur local** : Vite → port 5173

### IA
- **Chatbot** : Gemini AI (Google AI Studio — free tier)

---

## Chemins des projets

```
Backend  : C:\Users\DELL\Documents\projetpfe\portail-rh-backend\
Frontend : C:\Users\DELL\Documents\projetpfe\portail-rh-frontend\
```

---

## Base de données

**Nom** : portail_rh  
**Host** : localhost  
**Port** : 5432  
**User** : postgres  
**Password** : rayen

### Tables
| Table | Description |
|-------|-------------|
| users | Tous les utilisateurs (employé, chef, admin) |
| demandes | Toutes les demandes RH |
| notifications | Notifications entre acteurs |
| messages | Messages internes |
| documents | Documents administratifs |
| conges_soldes | Soldes de congés par employé |

### Contrainte importante
```sql
-- La colonne role accepte UNIQUEMENT ces 3 valeurs :
CHECK (role IN ('employe', 'chef', 'admin'))
-- ⚠️ PAS 'employee' — c'est 'employe' (sans e final)
```

---

## Acteurs et Rôles

| Rôle | Accès |
|------|-------|
| `employe` | Ses propres demandes uniquement |
| `chef` | Demandes de son équipe (congé + autorisation), gestion employés |
| `admin` | Tout — toutes les demandes, tous les employés, dashboard stats |

### Règle métier importante
- Le chef valide d'abord, puis l'admin valide ensuite
- Si le chef est absent/indisponible, l'admin peut valider directement
- Le chef ne peut valider que : **congé** et **autorisation**
- L'admin valide **tout** sans restriction

---

## API Laravel — Routes principales

```
POST   /api/register          → Créer un compte
POST   /api/login             → Connexion JWT
POST   /api/logout            → Déconnexion
GET    /api/me                → Utilisateur connecté

GET    /api/demandes          → Liste demandes (filtrée par rôle)
POST   /api/demandes          → Créer une demande
GET    /api/demandes/{id}     → Détail demande
PUT    /api/demandes/{id}     → Modifier/valider demande
DELETE /api/demandes/{id}     → Annuler demande

GET    /api/users             → Liste utilisateurs (admin/chef)
GET    /api/users/dashboard   → Stats dashboard (admin)
GET    /api/users/{id}        → Détail utilisateur
PUT    /api/users/{id}        → Modifier utilisateur
DELETE /api/users/{id}        → Supprimer utilisateur

GET    /api/notifications          → Notifications de l'utilisateur
PUT    /api/notifications/{id}/lu  → Marquer comme lue
PUT    /api/notifications/tout-lu  → Tout marquer lu

POST   /api/chatbot           → Assistant Gemini AI
```

### Headers obligatoires pour toutes les requêtes protégées
```
Authorization: Bearer <token_jwt>
Accept: application/json
Content-Type: application/json
```

---

## Models Laravel — $fillable importants

### User
```php
protected $fillable = [
    'nom', 'prenom', 'email', 'password',
    'role', 'chef_id', 'departement', 'poste', 'telephone'
];
// Implémente JWTSubject — méthodes getJWTIdentifier() et getJWTCustomClaims()
```

### Demande
```php
protected $fillable = [
    'employee_id', 'chef_id', 'admin_id',
    'type', 'statut', 'date_debut', 'date_fin',
    'montant', 'duree', 'motif', 'type_document',
    'commentaire', 'commentaire_chef', 'commentaire_admin'
];
// Types : conge | pret | situation | autorisation | document
// Statuts : en_attente | valide_chef | approuvee | refusee | approuvee_direct
```

### Notification
```php
public $timestamps = false; // ⚠️ Pas de updated_at dans la table !
protected $fillable = ['user_id', 'demande_id', 'message', 'lu'];
```

---

## Structure Frontend React

```
src/
├── main.jsx                  ← BrowserRouter + AuthProvider
├── App.jsx                   ← Routes (Landing, Login, Dashboard, ...)
├── index.css                 ← Variables CSS globales
├── api/
│   └── axios.js              ← Instance Axios + interceptors JWT
├── context/
│   └── AuthContext.jsx       ← user, token, login(), logout()
├── components/
│   ├── Sidebar.jsx           ← Navigation filtrée par rôle
│   ├── Topbar.jsx            ← Titre + notifications temps réel
│   ├── Layout.jsx            ← Sidebar + Topbar + children
│   └── PrivateRoute.jsx      ← Redirect vers /login si pas connecté
└── pages/
    ├── Landing.jsx           ← Page d'accueil ArabSoft
    ├── Login.jsx             ← Connexion JWT
    ├── Dashboard.jsx         ← Stats + demandes récentes
    ├── Demandes.jsx          ← Mes demandes (employé)
    ├── AllDemandes.jsx       ← Toutes les demandes (admin/chef)
    ├── Employes.jsx          ← Gestion employés (admin/chef)
    ├── Chatbot.jsx           ← Assistant Gemini AI (⏳ à faire)
    └── Profil.jsx            ← Mon profil (⏳ à faire)
```

---

## Variables CSS Globales (index.css)

```css
--accent: #FF2D20;        /* Rouge principal */
--accent-light: #FFF1F0;  /* Rouge clair */
--text: #18181B;          /* Texte principal */
--text2: #71717A;         /* Texte secondaire */
--text3: #A1A1AA;         /* Texte tertiaire */
--bg: #FAFAFA;            /* Fond global */
--white: #FFFFFF;         /* Blanc pur */
--surface: #F4F4F5;       /* Surface cards */
--border: #E4E4E7;        /* Bordures */
--border2: #D4D4D8;       /* Bordures plus foncées */
--green: #22C55E;
--green-light: #F0FDF4;
--blue: #3B82F6;
--blue-light: #EFF6FF;
--shadow-sm: 0 1px 3px rgba(0,0,0,0.07);
--shadow: 0 4px 16px rgba(0,0,0,0.08);
--shadow-lg: 0 20px 48px rgba(0,0,0,0.10);
--radius: 12px;
--radius-lg: 20px;
```

---

## Pages complétées ✅ / À faire ⏳

| Page | Route | Statut |
|------|-------|--------|
| Landing ArabSoft | `/` | ✅ |
| Login JWT | `/login` | ✅ |
| Dashboard + Stats API | `/dashboard` | ✅ |
| Mes Demandes + CRUD | `/demandes` | ✅ |
| Toutes les Demandes | `/all-demandes` | ✅ |
| Employés + CRUD | `/employes` | ✅ |
| Chatbot Gemini AI | `/chatbot` | ⏳ |
| Mon Profil | `/profil` | ⏳ |

---

## Commandes utiles

### Backend Laravel
```bash
cd C:\Users\DELL\Documents\projetpfe\portail-rh-backend

php artisan serve              # Démarre le serveur (port 8000)
php artisan route:list         # Liste toutes les routes
php artisan migrate            # Exécuter les migrations
php artisan migrate:status     # Vérifier l'état des migrations
php artisan config:clear       # Vider le cache config
php artisan cache:clear        # Vider le cache
php artisan tinker             # Console interactive
php artisan jwt:secret         # Regénérer la clé JWT
```

### Frontend React
```bash
cd C:\Users\DELL\Documents\projetpfe\portail-rh-frontend

npm run dev    # Démarre le serveur (port 5173)
npm run build  # Build production
```

---

## Bugs résolus (historique)

| Bug | Cause | Solution |
|-----|-------|----------|
| 500 register | `$fillable` User vide (Laravel défaut) | Ajouter nom, prenom, role, etc. |
| 500 demandes | `$fillable` Demande vide | Ajouter tous les champs |
| 500 notifications | `$fillable` Notification vide | Ajouter user_id, demande_id, message, lu |
| 500 notifications | Colonne `updated_at` manquante | Ajouter `public $timestamps = false` |
| 500 demandes | Colonnes `motif` et `duree` manquantes | Migration d'ajout de colonnes |
| 422 register | Contrainte `role_check` avec 'employee' | Recréer contrainte avec 'employe' |
| Auth guard | `config/auth.php` manquant guard api | Ajouter driver jwt |
| Redirect login | PrivateRoute manquant | Créer PrivateRoute.jsx |

---

## Prochaines étapes

1. **Chatbot Gemini AI** — Page `/chatbot` avec intégration API Gemini
2. **Mon Profil** — Page `/profil` avec modification des infos personnelles
3. **Tests finaux** — Tester tous les rôles et workflows
4. **Rapport PFE** — Rédiger le rapport final

---

## Contact ArabSoft

- **Site** : https://www.arabsoft.com.tn
- **Adresse** : Rue 8368, Montplaisir, 1073 Tunis
- **Tél** : +216 71 95 12 48
- **Email** : arabsoft@arabsoft.com.tn
- **Solution RH** : AJIR

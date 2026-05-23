# Rapport Technique — Portail RH Digital ArabSoft

**Projet PFE** — ISTIC, Université de Carthage 2026  
**Étudiant** : Rayen — GLSI 3ème année  
**Entreprise d'accueil** : ArabSoft, Tunis, Tunisie  
**Sujet** : Élaboration d'un Portail RH Digital  
**Date** : 15 Avril 2026

---

## Table des matières

1. [Vue d'ensemble du projet](#1-vue-densemble-du-projet)
2. [Architecture technique](#2-architecture-technique)
3. [Stack technologique](#3-stack-technologique)
4. [Base de données — Modèle relationnel](#4-base-de-données--modèle-relationnel)
5. [Backend Laravel — API RESTful](#5-backend-laravel--api-restful)
6. [Frontend React — Interface utilisateur](#6-frontend-react--interface-utilisateur)
7. [Authentification & Sécurité](#7-authentification--sécurité)
8. [Workflow métier — Gestion des demandes](#8-workflow-métier--gestion-des-demandes)
9. [Module Chatbot IA — Gemini](#9-module-chatbot-ia--gemini)
10. [Module Réinitialisation de mot de passe](#10-module-réinitialisation-de-mot-de-passe)
11. [Animations & UX avancé](#11-animations--ux-avancé)
12. [Statistiques du code source](#12-statistiques-du-code-source)
13. [Tests & Validation](#13-tests--validation)
14. [Améliorations futures](#14-améliorations-futures)

---

## 1. Vue d'ensemble du projet

### 1.1 Objectif

Le **Portail RH ArabSoft** est une application web complète permettant la digitalisation des processus de gestion des ressources humaines. Il centralise toutes les demandes administratives (congés, prêts, autorisations, documents, changements de situation) dans un espace sécurisé avec un workflow de validation multi-niveaux.

### 1.2 Problématique

ArabSoft, éditeur de logiciels depuis 1985, gérait les demandes RH via des formulaires papier et des échanges email, entraînant :
- Des délais de traitement longs
- Un manque de traçabilité
- L'absence de tableau de bord décisionnel
- Aucune visibilité temps réel pour les employés

### 1.3 Solution proposée

Un portail web full-stack avec :
- **3 rôles distincts** : Employé, Chef hiérarchique, Administrateur RH
- **5 types de demandes** : Congé, Prêt, Autorisation, Document, Changement de situation
- **Workflow de validation** structuré : Employé → Chef → Admin
- **Assistant IA** (Gemini) pour répondre aux questions RH
- **Notifications temps réel** et messagerie interne
- **Dashboard analytique** pour le suivi décisionnel

---

## 2. Architecture technique

### 2.1 Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        UTILISATEUR                               │
│                    (Navigateur Web)                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │  HTTP / HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                        │
│                   Port 5173 (dev)                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Pages    │  │Components│  │ Context  │  │ API (Axios)    │  │
│  │ (11)     │  │ (5)      │  │ (Auth)   │  │ JWT Interceptor│  │
│  └──────────┘  └──────────┘  └──────────┘  └───────┬────────┘  │
└─────────────────────────────────────────────────────┼───────────┘
                                                      │ REST API
                                                      │ JSON + JWT Bearer
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Laravel 12)                            │
│                   Port 8000                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │Controllers│  │ Models  │  │Middleware│  │ Mail (SMTP)    │  │
│  │ (7)      │  │ (7)      │  │ JWT Auth │  │ Gmail TLS      │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└──────────────────────┬──────────────────────┬───────────────────┘
                       │                      │
                       ▼                      ▼
┌──────────────────────────┐    ┌─────────────────────────────────┐
│   PostgreSQL 17          │    │   APIs Externes                  │
│   Base : portail_rh      │    │   ├── Gemini AI (Google)         │
│   Port : 5432            │    │   └── Gmail SMTP (port 587)      │
│   7 tables métier        │    │                                   │
└──────────────────────────┘    └─────────────────────────────────┘
```

### 2.2 Pattern architectural

- **Backend** : Architecture MVC (Model-View-Controller) — Laravel
- **Frontend** : Architecture Component-Based — React avec Context API
- **Communication** : API RESTful avec échange JSON
- **Authentification** : Stateless via JWT (JSON Web Tokens)

---

## 3. Stack technologique

### 3.1 Backend

| Technologie | Version | Rôle |
|---|---|---|
| **PHP** | 8.2 | Langage serveur |
| **Laravel** | 12.0 | Framework MVC |
| **PostgreSQL** | 17 | Base de données relationnelle |
| **tymon/jwt-auth** | 2.3 | Authentification JWT |
| **Laravel Sanctum** | 4.0 | Tokens API (backup) |
| **XAMPP** | — | Serveur local Apache + PHP |

### 3.2 Frontend

| Technologie | Version | Rôle |
|---|---|---|
| **React** | 19.2.4 | Bibliothèque UI |
| **Vite** | 8.0.0 | Build tool + serveur dev |
| **React Router** | 7.13.1 | Routage SPA |
| **Axios** | 1.13.6 | Client HTTP |
| **Bootstrap** | 5.3.8 | Utilitaires CSS responsive |

### 3.3 Services externes

| Service | Usage |
|---|---|
| **Google Gemini AI** (gemini-2.5-flash) | Chatbot assistant RH |
| **Gmail SMTP** (port 587, TLS) | Envoi d'emails transactionnels |
| **Google Fonts** | Typographies Inter + Instrument Serif |

---

## 4. Base de données — Modèle relationnel

### 4.1 Schéma des tables

**7 tables métier + 2 tables système** (9 migrations au total)

#### Table `users` — Utilisateurs
| Colonne | Type | Contrainte |
|---|---|---|
| `id` | bigint (PK) | Auto-increment |
| `nom` | string(100) | NOT NULL |
| `prenom` | string(100) | NOT NULL |
| `email` | string(150) | UNIQUE, NOT NULL |
| `password` | string | NOT NULL (bcrypt 12 rounds) |
| `role` | enum | CHECK IN ('employe', 'chef', 'admin') |
| `chef_id` | bigint (FK → users) | NULLABLE, ON DELETE SET NULL |
| `departement` | string(100) | NULLABLE |
| `poste` | string(100) | NULLABLE |
| `telephone` | string(20) | NULLABLE |
| `created_at` | timestamp | Auto |
| `updated_at` | timestamp | Auto |

> **Contrainte importante** : La colonne `role` utilise `'employe'` (français, sans 'e' final), pas `'employee'`.

#### Table `demandes` — Demandes RH
| Colonne | Type | Contrainte |
|---|---|---|
| `id` | bigint (PK) | Auto-increment |
| `employee_id` | bigint (FK → users) | ON DELETE CASCADE |
| `chef_id` | bigint (FK → users) | NULLABLE, ON DELETE SET NULL |
| `admin_id` | bigint (FK → users) | NULLABLE, ON DELETE SET NULL |
| `type` | enum | IN ('conge', 'autorisation', 'pret', 'situation', 'document') |
| `statut` | enum | IN ('en_attente', 'valide_chef', 'approuvee', 'refusee', 'approuvee_direct') — défaut: 'en_attente' |
| `date_debut` | date | NULLABLE |
| `date_fin` | date | NULLABLE |
| `montant` | decimal(10,2) | NULLABLE |
| `duree` | string | NULLABLE |
| `motif` | string | NULLABLE |
| `type_document` | string(100) | NULLABLE |
| `commentaire` | text | NULLABLE (commentaire employé) |
| `commentaire_chef` | text | NULLABLE |
| `commentaire_admin` | text | NULLABLE |
| `created_at` / `updated_at` | timestamp | Auto |

#### Table `notifications` — Notifications
| Colonne | Type | Contrainte |
|---|---|---|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | bigint (FK → users) | ON DELETE CASCADE |
| `demande_id` | bigint (FK → demandes) | NULLABLE, ON DELETE CASCADE |
| `message` | text | NOT NULL |
| `lu` | boolean | Défaut: false |
| `created_at` | timestamp | Auto |

> **Note** : Pas de colonne `updated_at` (`$timestamps = false` dans le Model).

#### Table `conges_soldes` — Soldes de congés
| Colonne | Type | Contrainte |
|---|---|---|
| `id` | bigint (PK) | Auto-increment |
| `employee_id` | bigint (FK → users) | ON DELETE CASCADE |
| `annuel_total` | integer | Défaut: 30 |
| `annuel_pris` | integer | Défaut: 0 |
| `maladie_total` | integer | Défaut: 10 |
| `maladie_pris` | integer | Défaut: 0 |
| `exceptionnel_total` | integer | Défaut: 5 |
| `exceptionnel_pris` | integer | Défaut: 0 |
| `annee` | integer | Année de référence |

> **Contrainte UNIQUE** sur `(employee_id, annee)` — un seul solde par employé par an.

#### Table `messages` — Messagerie interne
| Colonne | Type | Contrainte |
|---|---|---|
| `id` | bigint (PK) | Auto-increment |
| `expediteur_id` | bigint (FK → users) | ON DELETE CASCADE |
| `destinataire_id` | bigint (FK → users) | ON DELETE CASCADE |
| `contenu` | text | NOT NULL |
| `lu` | boolean | Défaut: false |
| `created_at` | timestamp | Auto |

#### Table `documents` — Documents administratifs
| Colonne | Type | Contrainte |
|---|---|---|
| `id` | bigint (PK) | Auto-increment |
| `demande_id` | bigint (FK → demandes) | NULLABLE, ON DELETE CASCADE |
| `employee_id` | bigint (FK → users) | ON DELETE CASCADE |
| `nom_fichier` | string(255) | NOT NULL |
| `chemin_fichier` | string(500) | NOT NULL |
| `type_doc` | string(100) | NOT NULL |
| `created_at` | timestamp | Auto |

#### Table `password_resets` — Réinitialisation de mots de passe
| Colonne | Type | Contrainte |
|---|---|---|
| `id` | bigint (PK) | Auto-increment |
| `user_id` | bigint (FK → users) | ON DELETE CASCADE |
| `email` | string | INDEX |
| `token` | string | NULLABLE (hash SHA-256) |
| `statut` | string | Défaut: 'en_attente' — INDEX |
| `created_at` | timestamp | Auto |
| `expires_at` | timestamp | NULLABLE (15 min après approbation) |

### 4.2 Relations entre tables

```
users (1) ──────── (N) demandes        [employee_id]
users (1) ──────── (N) users           [chef_id → auto-référence]
users (1) ──────── (1) conges_soldes   [employee_id]
users (1) ──────── (N) notifications   [user_id]
users (1) ──────── (N) messages        [expediteur_id / destinataire_id]
users (1) ──────── (N) password_resets [user_id]
demandes (1) ────── (N) notifications  [demande_id]
demandes (1) ────── (N) documents      [demande_id]
```

---

## 5. Backend Laravel — API RESTful

### 5.1 Contrôleurs (7 contrôleurs, 29 endpoints)

#### AuthController.php (80 lignes) — Authentification JWT

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `register()` | POST `/api/register` | Non | Création de compte avec validation (nom, prenom, email unique, password min 6, role in employe/chef/admin). Retourne JWT token + user. |
| `login()` | POST `/api/login` | Non | Connexion JWT. Vérifie credentials via `JWTAuth::attempt()`. Retourne token ou 401. |
| `logout()` | POST `/api/logout` | Oui | Invalide le token JWT via `JWTAuth::invalidate()`. |
| `me()` | GET `/api/me` | Oui | Retourne l'utilisateur authentifié via `JWTAuth::parseToken()->authenticate()`. |

#### DemandeController.php (189 lignes) — Gestion des demandes RH

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `index()` | GET `/api/demandes` | Oui | Liste filtrée par rôle : admin voit tout, chef voit congé/autorisation de son équipe, employé voit ses propres demandes. Inclut relations employee, chef, admin. |
| `store()` | POST `/api/demandes` | Oui | Crée une demande. Valide le type (conge\|autorisation\|pret\|situation\|document). Attribue automatiquement `employee_id` et `chef_id`. Crée notification au destinataire approprié (chef pour congé/autorisation, admin sinon). |
| `show($id)` | GET `/api/demandes/{id}` | Oui | Détail d'une demande avec vérification de permission. |
| `update($id)` | PUT `/api/demandes/{id}` | Oui | **Logique complexe par rôle** : Employé modifie ses demandes en attente. Chef valide uniquement congé/autorisation (→ valide_chef ou refusee). Admin valide tout (→ approuvee ou refusee). Notification créée à chaque action. |
| `destroy($id)` | DELETE `/api/demandes/{id}` | Oui | Annulation : employé annule ses demandes en attente, admin peut supprimer toute demande. |

#### UserController.php (128 lignes) — Gestion utilisateurs & Dashboard

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `index()` | GET `/api/users` | Oui | Admin : tous les utilisateurs. Chef : ses subordonnés. Employé : 403 Forbidden. |
| `show($id)` | GET `/api/users/{id}` | Oui | Détail utilisateur avec relations chef et congesSolde. Permission vérifiée. |
| `update($id)` | PUT `/api/users/{id}` | Oui | Modification profil. Si changement de mot de passe : vérifie `current_password` via `Hash::check()` (sauf admin modifiant un autre). |
| `destroy($id)` | DELETE `/api/users/{id}` | Oui | Suppression (admin uniquement). |
| `dashboard()` | GET `/api/users/dashboard` | Oui | Stats admin : total_employes, demandes par statut. |
| `meStats()` | GET `/api/me/stats` | Oui | Stats employé : compteurs par statut, solde congés, 4 dernières demandes. |

#### NotificationController.php (50 lignes) — Notifications

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `index()` | GET `/api/notifications` | Oui | Liste des notifications + compteur non lues. |
| `marquerLu($id)` | PUT `/api/notifications/{id}/lu` | Oui | Marquer une notification comme lue. |
| `marquerToutLu()` | PUT `/api/notifications/tout-lu` | Oui | Tout marquer comme lu. |

#### MessageController.php (59 lignes) — Messagerie interne

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `index()` | GET `/api/messages` | Oui | Messages envoyés et reçus, triés par date desc. |
| `store()` | POST `/api/messages` | Oui | Envoi d'un message. Valide destinataire_id et contenu. |
| `marquerLu($id)` | PUT `/api/messages/{id}/lu` | Oui | Marquer un message reçu comme lu. |

#### ChatbotController.php (151 lignes) — Assistant IA Gemini

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `chat()` | POST `/api/chatbot` | Oui | Reçoit un message (max 1000 chars). Construit un prompt système enrichi avec : profil utilisateur, solde de congés, 10 dernières demandes. Appelle l'API Gemini (gemini-2.5-flash, temperature 0.7, maxTokens 600). Retourne la réponse IA. |

#### PasswordResetController.php (209 lignes) — Réinitialisation de mot de passe

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `request()` | POST `/api/forgot-password` | Non | Crée une demande de réinitialisation. Anti-spam : une seule demande en attente par email. Notifie tous les admins. |
| `adminList()` | GET `/api/password-resets` | Oui (admin) | Liste des demandes avec filtre par statut. |
| `adminApprove($id)` | PUT `/api/password-resets/{id}/approve` | Oui (admin) | **Workflow sécurisé** : Génère token aléatoire 64 chars → hash SHA-256 → envoie email AVANT de persister → si envoi OK, sauvegarde statut 'approuvee' + expires_at (15 min). Pattern de rollback si l'email échoue. |
| `adminReject($id)` | PUT `/api/password-resets/{id}/reject` | Oui (admin) | Rejette la demande. Notifie l'utilisateur. |
| `validateToken()` | GET `/api/reset-password/validate` | Non | Valide token par comparaison SHA-256. Vérifie statut + expiration. |
| `reset()` | POST `/api/reset-password` | Non | Réinitialise le mot de passe (min 6 chars, confirmed). Marque le reset comme 'utilisee'. |

### 5.2 Modèles Eloquent (7 modèles)

| Modèle | Lignes | $fillable | Relations | Particularités |
|---|---|---|---|---|
| **User** | 74 | nom, prenom, email, password, role, chef_id, departement, poste, telephone | chef(), employes(), congesSolde(), demandes() | Implémente JWTSubject, cast `password => hashed` |
| **Demande** | 49 | employee_id, chef_id, admin_id, type, statut, date_debut, date_fin, montant, duree, motif, type_document, commentaire, commentaire_chef, commentaire_admin | employee(), chef(), admin() | Casts: date_debut/fin → date, montant → decimal:2 |
| **Notification** | 32 | user_id, demande_id, message, lu | user(), demande() | `$timestamps = false` (pas de updated_at) |
| **PasswordReset** | 29 | user_id, email, token, statut, created_at, expires_at | user() | `$timestamps = false`, casts datetime |
| **Message** | 10 | — | — | Modèle de base |
| **Document** | 10 | — | — | Modèle de base |
| **CongesSolde** | 10 | — | — | Modèle de base |

### 5.3 Mailable — ResetPasswordMail (44 lignes)

- **Sujet** : "Réinitialisation de votre mot de passe — Portail RH ArabSoft"
- **Template** : `resources/views/emails/reset-password.blade.php` (80 lignes)
- **Contenu** : Header ArabSoft brandé, bouton CTA rouge, lien de fallback, avertissement 15 min
- **URL générée** : `http://localhost:5173/reset-password?token={plainToken}&email={urlencoded}`

### 5.4 Routes API — Récapitulatif complet

```
ROUTES PUBLIQUES (5) :
  POST   /api/login                        → AuthController@login
  POST   /api/register                     → AuthController@register
  POST   /api/forgot-password              → PasswordResetController@request
  GET    /api/reset-password/validate      → PasswordResetController@validateToken
  POST   /api/reset-password               → PasswordResetController@reset

ROUTES PROTÉGÉES — auth:api JWT (24) :
  POST   /api/logout                       → AuthController@logout
  GET    /api/me                           → AuthController@me

  GET    /api/demandes                     → DemandeController@index
  POST   /api/demandes                     → DemandeController@store
  GET    /api/demandes/{id}                → DemandeController@show
  PUT    /api/demandes/{id}                → DemandeController@update
  DELETE /api/demandes/{id}                → DemandeController@destroy

  GET    /api/notifications                → NotificationController@index
  PUT    /api/notifications/{id}/lu        → NotificationController@marquerLu
  PUT    /api/notifications/tout-lu        → NotificationController@marquerToutLu

  GET    /api/messages                     → MessageController@index
  POST   /api/messages                     → MessageController@store
  PUT    /api/messages/{id}/lu             → MessageController@marquerLu

  GET    /api/users                        → UserController@index
  GET    /api/users/dashboard              → UserController@dashboard
  GET    /api/me/stats                     → UserController@meStats
  GET    /api/users/{id}                   → UserController@show
  PUT    /api/users/{id}                   → UserController@update
  DELETE /api/users/{id}                   → UserController@destroy

  POST   /api/chatbot                      → ChatbotController@chat

  GET    /api/password-resets              → PasswordResetController@adminList
  PUT    /api/password-resets/{id}/approve → PasswordResetController@adminApprove
  PUT    /api/password-resets/{id}/reject  → PasswordResetController@adminReject
```

**Total : 29 endpoints API**

---

## 6. Frontend React — Interface utilisateur

### 6.1 Architecture des fichiers

```
src/
├── main.jsx                     ← Point d'entrée (BrowserRouter + AuthProvider)
├── App.jsx                      ← Définition des 10 routes
├── index.css                    ← Variables CSS + animations globales (58 lignes)
├── api/
│   └── axios.js                 ← Instance Axios + intercepteurs JWT (33 lignes)
├── context/
│   └── AuthContext.jsx          ← Contexte auth : user, token, login(), logout() (51 lignes)
├── components/
│   ├── Sidebar.jsx              ← Navigation filtrée par rôle (103 lignes)
│   ├── Topbar.jsx               ← Titre + notifications temps réel (122 lignes)
│   ├── Layout.jsx               ← Sidebar + Topbar + ChatbotWidget (165 lignes)
│   ├── PrivateRoute.jsx         ← Guard : redirect /login si non connecté (20 lignes)
│   └── ChatbotWidget.jsx        ← Widget chatbot flottant (290 lignes)
└── pages/
    ├── Landing.jsx              ← Page d'accueil animée (519 lignes)
    ├── Login.jsx                ← Connexion JWT (223 lignes)
    ├── ForgotPassword.jsx       ← Demande de réinitialisation (180 lignes)
    ├── ResetPassword.jsx        ← Formulaire nouveau mot de passe (267 lignes)
    ├── Dashboard.jsx            ← Tableau de bord par rôle (372 lignes)
    ├── Demandes.jsx             ← Mes demandes — CRUD complet (571 lignes)
    ├── AllDemandes.jsx          ← Toutes les demandes — Validation (414 lignes)
    ├── Employes.jsx             ← Gestion employés — CRUD (425 lignes)
    ├── PasswordResets.jsx       ← Réinitialisations — Admin (200+ lignes)
    ├── Profil.jsx               ← Mon profil + sécurité (437 lignes)
    └── Chatbot.jsx              ← Assistant IA pleine page (310 lignes)
```

### 6.2 Routage

| Route | Composant | Protection | Accès |
|---|---|---|---|
| `/` | Landing | Publique | Tout le monde |
| `/login` | Login | Publique | Tout le monde |
| `/forgot-password` | ForgotPassword | Publique | Tout le monde |
| `/reset-password` | ResetPassword | Publique | Tout le monde |
| `/dashboard` | Dashboard | PrivateRoute | Tous rôles |
| `/demandes` | Demandes | PrivateRoute | Employé |
| `/all-demandes` | AllDemandes | PrivateRoute | Admin, Chef |
| `/employes` | Employes | PrivateRoute | Admin |
| `/password-resets` | PasswordResets | PrivateRoute | Admin |
| `/profil` | Profil | PrivateRoute | Tous rôles |

### 6.3 Détail des pages

#### Landing.jsx (519 lignes) — Page d'accueil

**8 sections** : Navigation, Hero, Stats, Features, About, Roles, CTA, Footer

**Animations avancées** :
- **ParticleNetwork** : Canvas 2D avec 70 particules (35 mobile) reliées par des lignes. Réactif au mouvement de la souris (rayon 180px). Symbolise le réseau d'employés connectés via le portail.
- **AnimatedCounter** : Compteurs animés (0 → valeur cible) avec easing easeOutQuart, déclenchés par IntersectionObserver.
- **Stagger Reveal** : Cards features et roles apparaissent en cascade (80ms entre chaque) via CSS `:nth-child()` avec `transition-delay`.

**Thème visuel** : Dark glassmorphism (#0A0A0F), accent rouge #FF2D20, typographies Instrument Serif (titres) + Inter (corps).

#### Login.jsx (223 lignes) — Connexion

- Formulaire email/password avec gestion d'erreurs
- **Boutons de démo** : 3 comptes pré-remplis (Employé, Chef, Admin) pour la soutenance
- Lien "Mot de passe oublié ?" vers `/forgot-password`
- Redirection vers `/dashboard` après connexion réussie

#### Dashboard.jsx (372 lignes) — Tableau de bord

**Deux variantes selon le rôle :**

- **Admin/Chef** : 4 cartes stats (en attente, approuvées, total employés, total demandes), tableau des demandes récentes, barres de progression congés
- **Employé** : 4 cartes stats personnelles, dernières demandes, solde de congés (annuel/maladie/exceptionnel), boutons d'action rapide

**Composant interne** : `AnimatedNumber` — incrémentation animée de 0 à la valeur sur 700ms.

#### Demandes.jsx (571 lignes) — Mes demandes (CRUD complet)

**Fonctionnalités** :
- Tabs de filtrage : Toutes, En attente, Approuvées, Refusées
- Formulaire dynamique selon le type de demande :
  - **Congé** : date_debut, date_fin, type (annuel/maladie/exceptionnel/sans solde)
  - **Prêt** : montant, durée (3/6/12/24 mois), type (personnel/avance)
  - **Autorisation** : date, motif
  - **Document** : type (attestation/salaire/bulletin/présence)
  - **Situation** : nature (adresse/mariage/naissance/divorce)
- Modal de détail, modal d'édition
- Boutons Modifier/Annuler (uniquement si statut `en_attente`)
- Toast notifications auto-dismiss (3.5s)

#### AllDemandes.jsx (414 lignes) — Validation des demandes

**Tabs** : Toutes, En attente, Validées chef, Approuvées, Refusées (avec compteurs badge)

**Logique par rôle** :
- **Chef** : Peut valider uniquement congé et autorisation (statut en_attente) → marque comme `valide_chef`
- **Admin** : Peut valider tout type (en_attente et valide_chef) → marque comme `approuvee`
- Les deux peuvent ajouter un commentaire visible par l'employé

**Modal** : Infos employé, détails demande, commentaires existants, section décision.

#### Employes.jsx (425 lignes) — Gestion des employés (Admin)

- Grille de cards (3 colonnes, responsive)
- Recherche par nom/email/département
- CRUD complet : créer, modifier, supprimer un employé
- Attribution de rôle et de chef hiérarchique
- Validation : email unique, password min 6 chars (création), password optionnel (modification)
- Badge de rôle avec gradient de couleur différent

#### Profil.jsx (437 lignes) — Mon profil

**Deux sections :**
1. **Infos personnelles** : Formulaire éditable (prenom, nom, email, téléphone, département, poste). Détection de changements non sauvegardés (dirty state).
2. **Sécurité** : Changement de mot de passe avec vérification du mot de passe actuel (`current_password`). Hints visuels en temps réel (longueur min 8, correspondance).

#### Chatbot.jsx (310 lignes) — Assistant IA pleine page

- Historique de messages avec distinction bot/utilisateur
- 6 boutons de raccourcis prédéfinis (solde congé, statut demande, prêt, etc.)
- Support multilignes (Shift+Enter)
- Formatage **gras** dans les réponses
- Indicateur de statut "En ligne"

### 6.4 Composants réutilisables

| Composant | Lignes | Rôle |
|---|---|---|
| **Layout** | 165 | Structure principale : sidebar fixe (240px) + topbar sticky (64px) + contenu + ChatbotWidget |
| **Sidebar** | 103 | Navigation avec avatar utilisateur, menu filtré par rôle, bouton déconnexion |
| **Topbar** | 122 | Titre de page dynamique, cloche de notifications avec badge non lues (polling 30s) |
| **PrivateRoute** | 20 | Guard d'authentification : vérifie token, affiche loading, redirect /login |
| **ChatbotWidget** | 290 | FAB flottant (bottom-right), chat box 360×520px, indicateur de frappe animé, badge non lu |

### 6.5 Gestion d'état — AuthContext

```
AuthContext (React Context API)
├── State : user, token, loading
├── login(email, password) → POST /api/login → stocke token + GET /api/me
├── logout() → POST /api/logout → vide localStorage → redirect /
└── Persistance : localStorage('token', 'user') → restauré au rechargement
```

### 6.6 Intercepteur Axios

```javascript
// Request Interceptor : Injection automatique du JWT
headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`

// Response Interceptor : Gestion expiration JWT
if (error.response.status === 401) {
  localStorage.clear() → redirect /login
}
```

### 6.7 Design System

**Thème** : Dark Glassmorphism

| Variable CSS | Valeur | Usage |
|---|---|---|
| `--bg` | #0A0A0F | Fond global |
| `--accent` | #FF2D20 | Rouge principal (inspiré Laravel) |
| `--accent-light` | #FFF1F0 | Rouge clair (badges) |
| `--green` | #22C55E | Succès, validations |
| `--blue` | #3B82F6 | Information |
| `--border` | rgba(255,255,255,0.06-0.12) | Bordures glass |
| `--shadow` | 0 4px 16px rgba(0,0,0,0.08) | Ombres |
| `--radius` | 12px | Coins arrondis |
| `--radius-lg` | 20px | Grands conteneurs |

**Animations CSS globales** : fadeIn, slideUp, modalIn, shimmer (skeleton loading), toastIn, pulse, countUp

**Typographies** :
- **Instrument Serif** : Titres, nombres, éléments décoratifs
- **Inter** : Corps de texte, labels, boutons

---

## 7. Authentification & Sécurité

### 7.1 Flux JWT

```
1. LOGIN
   Client → POST /api/login {email, password}
   Server → Vérifie credentials → Génère JWT token (HS256, TTL 60 min)
   Client ← {token: "eyJ..."} → Stocke dans localStorage

2. REQUÊTES PROTÉGÉES
   Client → GET /api/demandes
            Header: Authorization: Bearer eyJ...
   Server → Middleware auth:api → Décode JWT → Vérifie signature + expiration
   Client ← {data: [...]}

3. LOGOUT
   Client → POST /api/logout
   Server → Blackliste le token (invalidation)
   Client → Vide localStorage → Redirect /login

4. EXPIRATION
   Server → 401 Unauthorized
   Client → Intercepteur Axios → Vide localStorage → Redirect /login
```

### 7.2 Configuration JWT

| Paramètre | Valeur |
|---|---|
| Algorithme | HS256 (HMAC symétrique) |
| Durée de vie (TTL) | 60 minutes |
| Refresh TTL | 20 160 minutes (2 semaines) |
| Blacklist | Activé (révocation au logout) |
| Claims requis | iss, iat, exp, nbf, sub, jti |
| Provider crypto | Lcobucci |

### 7.3 Sécurité des mots de passe

- **Hachage** : Bcrypt avec 12 rounds (via cast `'password' => 'hashed'` dans le modèle User)
- **Validation** : Minimum 6 caractères + confirmation
- **Reset** : Token 64 chars (Str::random) → hashé SHA-256 en base → comparaison sécurisée
- **Vérification ancien mot de passe** : `Hash::check()` obligatoire pour changement de mot de passe

### 7.4 Contrôle d'accès par rôle

| Action | Employé | Chef | Admin |
|---|---|---|---|
| Voir ses propres demandes | ✅ | ✅ | ✅ |
| Créer une demande | ✅ | ✅ | ✅ |
| Valider congé/autorisation | ❌ | ✅ | ✅ |
| Valider prêt/situation/document | ❌ | ❌ | ✅ |
| Voir toutes les demandes | ❌ | Équipe seule | ✅ |
| Gérer les employés | ❌ | ❌ | ✅ |
| Voir le dashboard global | ❌ | ❌ | ✅ |
| Gérer les réinitialisations | ❌ | ❌ | ✅ |
| Utiliser le chatbot | ✅ | ✅ | ✅ |

---

## 8. Workflow métier — Gestion des demandes

### 8.1 Cycle de vie d'une demande

```
                    ┌──────────────────┐
                    │   EMPLOYÉ CRÉE   │
                    │   une demande     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   EN_ATTENTE      │
                    │   Notification →  │
                    │   Chef ou Admin   │
                    └───┬──────────┬───┘
                        │          │
          ┌─────────────┘          └─────────────┐
          │ (Congé / Autorisation)               │ (Prêt / Situation / Document)
          ▼                                       ▼
┌──────────────────┐                    ┌──────────────────┐
│  CHEF EXAMINE    │                    │  ADMIN EXAMINE    │
│  ├─ Approuve     │                    │  ├─ Approuve      │
│  └─ Refuse       │                    │  └─ Refuse        │
└───┬──────────┬───┘                    └───┬──────────┬───┘
    │          │                             │          │
    ▼          ▼                             ▼          ▼
┌────────┐ ┌────────┐                  ┌────────┐ ┌────────┐
│VALIDE_ │ │REFUSEE │                  │APPROU- │ │REFUSEE │
│CHEF    │ │        │                  │VEE     │ │        │
└───┬────┘ └────────┘                  │(direct)│ └────────┘
    │                                  └────────┘
    ▼
┌──────────────────┐
│  ADMIN EXAMINE    │
│  ├─ Approuve      │
│  └─ Refuse        │
└───┬──────────┬───┘
    │          │
    ▼          ▼
┌────────┐ ┌────────┐
│APPROU- │ │REFUSEE │
│VEE     │ │        │
└────────┘ └────────┘
```

### 8.2 Statuts possibles

| Statut | Signification | Qui peut le déclencher |
|---|---|---|
| `en_attente` | Demande créée, en attente de traitement | Automatique à la création |
| `valide_chef` | Approuvée par le chef, en attente de l'admin | Chef |
| `approuvee` | Approuvée définitivement | Admin |
| `approuvee_direct` | Approuvée directement par l'admin (sans chef) | Admin |
| `refusee` | Refusée | Chef ou Admin |

### 8.3 Notifications automatiques

| Événement | Destinataire | Message type |
|---|---|---|
| Nouvelle demande (congé/autorisation) | Chef hiérarchique | "Nouvelle demande de congé de [Prénom Nom]" |
| Nouvelle demande (prêt/situation/document) | Admin | "Nouvelle demande de [type] de [Prénom Nom]" |
| Chef valide | Admin | "Demande validée par le chef, en attente de votre approbation" |
| Admin approuve | Employé | "Votre demande a été approuvée" |
| Chef/Admin refuse | Employé | "Votre demande a été refusée" |
| Demande de réinitialisation mdp | Tous les admins | "Demande de réinitialisation pour [email]" |

---

## 9. Module Chatbot IA — Gemini

### 9.1 Architecture

```
┌───────────┐     ┌──────────────┐     ┌─────────────────────┐
│ Frontend  │────▶│ Laravel API  │────▶│ Google Gemini AI     │
│ Chatbot   │     │ /api/chatbot │     │ gemini-2.5-flash     │
│ Widget +  │◀────│              │◀────│                      │
│ Page      │     │ Enrichit le  │     │ Temperature: 0.7     │
└───────────┘     │ prompt avec  │     │ MaxTokens: 600       │
                  │ contexte RH  │     └─────────────────────┘
                  └──────────────┘
```

### 9.2 Enrichissement du prompt

Le contrôleur backend enrichit chaque question utilisateur avec :

1. **Profil utilisateur** : nom, prénom, rôle, département, poste
2. **Solde de congés** : annuel (total/pris), maladie (total/pris), exceptionnel (total/pris)
3. **10 dernières demandes** : type, statut, dates, montant, motif, commentaires chef/admin
4. **Règles de réponse** : Répondre en français, format concis, rester dans le contexte RH

### 9.3 Interface utilisateur

- **ChatbotWidget** (flottant) : Accessible depuis toutes les pages, FAB bottom-right, chat box 360×520px
- **Page Chatbot** (pleine page) : Interface complète avec historique, raccourcis, support multilignes
- **6 raccourcis prédéfinis** : "Quel est mon solde de congé ?", "Statut de ma dernière demande", etc.

---

## 10. Module Réinitialisation de mot de passe

### 10.1 Workflow sécurisé

```
1. EMPLOYÉ → Saisit son email sur /forgot-password
   └─ POST /api/forgot-password
   └─ Crée PasswordReset (statut: en_attente)
   └─ Notifie TOUS les admins

2. ADMIN → Voit la demande sur /password-resets
   └─ Approuve → PUT /api/password-resets/{id}/approve
   └─ Génère token 64 chars (Str::random)
   └─ Hash SHA-256 stocké en base
   └─ ENVOIE EMAIL D'ABORD (rollback si échec)
   └─ Si email OK → sauvegarde statut 'approuvee' + expires_at (15 min)

3. EMPLOYÉ → Reçoit email avec lien
   └─ Clique sur le lien → /reset-password?token=xxx&email=xxx
   └─ GET /api/reset-password/validate → Vérifie token + expiration
   └─ Saisit nouveau mot de passe (min 6 chars + confirmation)
   └─ POST /api/reset-password → Met à jour le mot de passe

4. STATUT FINAL → 'utilisee'
```

### 10.2 Sécurité du token

| Aspect | Implémentation |
|---|---|
| Génération | `Str::random(64)` — 64 caractères aléatoires |
| Stockage | Hash SHA-256 en base (jamais le token en clair) |
| Validation | `hash('sha256', $tokenReçu) === $tokenStocké` |
| Expiration | 15 minutes après approbation admin |
| Usage unique | Statut passe à 'utilisee' après reset |
| Anti-spam | Une seule demande en_attente par email |

### 10.3 Email transactionnel

- **Transport** : Gmail SMTP (smtp.gmail.com:587, STARTTLS)
- **Authentification** : App Password Google (2FA requis)
- **Template** : HTML brandé ArabSoft (header noir, bouton CTA rouge, avertissement 15 min)

---

## 11. Animations & UX avancé

### 11.1 Landing page — Constellation d'équipe

**Technologie** : Canvas 2D + `requestAnimationFrame`

| Paramètre | Valeur Desktop | Valeur Mobile |
|---|---|---|
| Nombre de particules | 70 | 35 |
| Distance max entre particules | 140px | 140px |
| Rayon d'influence souris | 180px | — |
| Couleur particules | rgba(255,45,32,0.55) | idem |
| Couleur lignes inter-particules | rgba(255,255,255,0.08) | idem |
| Couleur lignes souris | rgba(255,45,32,0.35) | idem |
| Vitesse | 0.25 | 0.25 |

**Layering Z-index** : heroBg(0) → Canvas(1) → heroDots(2) → heroContent(3)

**Cleanup** : `cancelAnimationFrame` + `removeEventListener` au démontage.

### 11.2 Compteurs animés

- **Easing** : easeOutQuart — `1 - (1 - t)^4`
- **Durée** : 1800ms
- **Déclenchement** : IntersectionObserver (threshold: 0.5)
- **Parse intelligent** : "150+" → anime 0→150, conserve "+"  /  "ISO 9001" → affichage direct (pas d'animation)

### 11.3 Scroll Reveal

- **Basique** (`.reveal`) : opacity 0→1 + translateY 24px→0, durée 0.65s
- **Stagger** (`.reveal-stagger`) : Chaque enfant apparaît avec 80ms de délai supplémentaire (via `:nth-child` + `transition-delay`)
- **Déclenchement** : IntersectionObserver (threshold: 0.08)

### 11.4 Autres animations

| Animation | Usage | Durée |
|---|---|---|
| `fadeIn` | Apparition d'éléments | 0.3s |
| `slideUp` | Entrée de modals | 0.4s |
| `modalIn` | Overlay de modals | 0.3s |
| `shimmer` | Skeleton loading | 1.5s (infini) |
| `toastIn` | Notifications toast | 0.4s (slideUp) |
| `pulse` | Badges de notification | 2s (infini) |
| `countUp` | Compteurs dashboard | 0.7s |
| `AnimatedNumber` | Stats dashboard | 700ms |

---

## 12. Statistiques du code source

### 12.1 Backend (Laravel)

| Métrique | Valeur |
|---|---|
| Fichiers PHP (hors vendor) | 94 |
| Lignes de code PHP | ~7 034 |
| Contrôleurs | 7 (+1 base) |
| Modèles Eloquent | 7 |
| Migrations | 9 |
| Endpoints API | 29 |
| Mailables | 1 |
| Templates email | 1 |

### 12.2 Frontend (React)

| Métrique | Valeur |
|---|---|
| Fichiers JSX/JS | 20 |
| Lignes de code JSX/JS | ~4 853 |
| Pages | 11 |
| Composants réutilisables | 5 |
| Routes | 10 |
| Animations CSS globales | 7 |
| Variables CSS | 40+ |

### 12.3 Total projet

| Métrique | Valeur |
|---|---|
| **Lignes de code totales** | **~11 887** |
| **Fichiers source** | **114** |
| **Endpoints API** | **29** |
| **Tables base de données** | **7 + 2 système** |
| **Dépendances npm** | React 19, Vite 8, Axios, Bootstrap, React Router |
| **Dépendances composer** | Laravel 12, jwt-auth 2.3, Sanctum 4.0 |

---

## 13. Tests & Validation

### 13.1 Scénarios de test fonctionnel

#### Authentification
- [x] Inscription avec tous les rôles (employe, chef, admin)
- [x] Connexion JWT et obtention du token
- [x] Déconnexion et invalidation du token
- [x] Redirect automatique si token expiré (intercepteur Axios 401)
- [x] Accès interdit aux routes protégées sans token

#### Demandes RH
- [x] Création de chaque type de demande (5 types)
- [x] Validation chef → admin (workflow complet congé/autorisation)
- [x] Validation directe admin (prêt/situation/document)
- [x] Refus par chef ou admin avec commentaire
- [x] Modification d'une demande en attente par l'employé
- [x] Annulation d'une demande en attente
- [x] Filtrage par onglets (tous, en attente, approuvées, refusées)

#### Réinitialisation de mot de passe
- [x] Demande de réinitialisation (email existant)
- [x] Anti-spam : refus si demande déjà en attente
- [x] Approbation admin → envoi email SMTP Gmail
- [x] Validation token (valide, expiré, invalide)
- [x] Reset du mot de passe avec nouveau mot de passe

#### Dashboard
- [x] Stats admin : compteurs corrects
- [x] Stats employé : demandes personnelles + solde congés
- [x] Compteurs animés (AnimatedNumber)

#### Chatbot IA
- [x] Envoi de message et réponse Gemini
- [x] Contexte enrichi (profil + demandes + solde congés)
- [x] Raccourcis prédéfinis fonctionnels
- [x] Widget flottant accessible depuis toutes les pages

### 13.2 Bugs résolus pendant le développement

| Bug | Cause racine | Solution |
|---|---|---|
| 500 sur register | `$fillable` vide dans User | Ajout de tous les champs fillable |
| 500 sur demandes | `$fillable` vide dans Demande | Ajout de tous les champs fillable |
| 500 sur notifications | `updated_at` manquant en base | `$timestamps = false` dans le modèle |
| 500 sur notifications | `$fillable` vide | Ajout user_id, demande_id, message, lu |
| 422 sur register | Contrainte CHECK avec 'employee' au lieu de 'employe' | Recréation de la contrainte |
| Auth guard manquant | `config/auth.php` sans guard api JWT | Ajout du driver jwt |
| Redirect infini | PrivateRoute absent | Création de PrivateRoute.jsx |
| 422 sur forgot-password | Email de test non présent en base | Mise à jour email utilisateur via tinker |
| SMTP SSL error | `php.ini` pointant vers mauvais chemin cafile | Correction du chemin `C:\xampp\...` |
| Email non envoyé mais statut approuvé | Controller persistait AVANT l'envoi email | Rollback pattern : email d'abord, persist ensuite |
| Bouton reset non cliquable | Frontend exigeait 8 chars, backend 6 | Alignement sur min 6 chars |

---

## 14. Améliorations futures

### Court terme (v1.1)
- [ ] Upload de fichiers (pièces justificatives, photos de profil)
- [ ] Export PDF des demandes approuvées
- [ ] Pagination côté serveur pour les grandes listes
- [ ] Recherche avancée avec filtres multiples

### Moyen terme (v2.0)
- [ ] Notifications push (WebSocket / Server-Sent Events)
- [ ] Calendrier visuel des congés par équipe
- [ ] Historique d'audit (qui a fait quoi, quand)
- [ ] Mode multi-langue (FR / AR / EN)
- [ ] Progressive Web App (PWA) pour accès mobile

### Long terme (v3.0)
- [ ] Intégration avec le système de paie AJIR
- [ ] Génération automatique de documents (attestations, bulletins)
- [ ] Analyse prédictive IA (prévision absentéisme)
- [ ] SSO (Single Sign-On) avec Active Directory
- [ ] Déploiement cloud (Docker + CI/CD)

---

## Annexes

### A. Commandes de lancement

```bash
# Backend Laravel
cd C:\Users\DELL\Documents\projetpfe\portail-rh-backend
php artisan serve    # → http://localhost:8000

# Frontend React
cd C:\Users\DELL\Documents\projetpfe\portail-rh-frontend
npm run dev          # → http://localhost:5173
```

### B. Headers API obligatoires

```
Authorization: Bearer <token_jwt>
Accept: application/json
Content-Type: application/json
```

### C. Comptes de démonstration

| Rôle | Email | Usage |
|---|---|---|
| Admin | *(configuré en base)* | Accès total, validation, dashboard |
| Chef | *(configuré en base)* | Validation congé/autorisation |
| Employé | *(configuré en base)* | Soumission de demandes |

---

*Rapport généré le 15 Avril 2026 — Portail RH ArabSoft v1.0*
*Projet PFE — ISTIC, Université de Carthage*

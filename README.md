# SPBB Inscriptions - SvelteKit + Supabase

Application de gestion des inscriptions/licences SPBB (saison 2026-2027), avec separation stricte des espaces `user` et `admin`.

## Stack

- SvelteKit 2 + Svelte 5 (JavaScript)
- Supabase (Auth, Postgres, Storage)
- CSS composant (sans Tailwind)

## Prerequis

- Node.js 20+
- npm
- Projet Supabase avec schema metier et policies RLS deja en place

## Variables d'environnement

Copier `.env.example` vers `.env` puis configurer:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # recommande pour fallback creation profile
```

## Installation

```bash
npm install
```

## Lancement

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
```

## Tests E2E (Phase 4)

### Prerequis

- Configurer dans `.env`:
  - `E2E_USER_EMAIL`
  - `E2E_USER_PASSWORD`
  - `E2E_ADMIN_EMAIL`
  - `E2E_ADMIN_PASSWORD`

### Scenarios couverts

- Public:
  - affichage page accueil
  - redirection d une route protegee vers `/login`
- User:
  - acces aux routes membre
  - blocage acces admin
- Admin:
  - acces routes administration (`/admin/licencies`, `/admin/users`, `/admin/referentiels`)

### Lancer les tests

```bash
npm run test:e2e
```

Note: les tests `user` et `admin` sont automatiquement skip si les variables d environnement E2E ne sont pas renseignees.

## Routes principales

### Public

- `/` accueil
- `/login` connexion
- `/signup` creation de compte

### User (auth requis)

- `/inscription` formulaire dossier (brouillon/soumission)
- `/mon-dossier` suivi dossier + upload documents
- `/messagerie` conversation user/admin

### Admin (role `profiles.role = 'admin'`)

- `/admin/licencies` liste des dossiers
- `/admin/licencies/[registrationId]` fiche detail + actions RPC
- `/admin/users` promotion/demotion role user/admin
- `/admin/referentiels` gestion tables de reference

## Regles metier implementees

- Source des droits: `profiles.role`
- Un utilisateur voit uniquement ses propres donnees
- Un admin peut promouvoir un utilisateur existant en admin
- Un dossier utilisateur est editable tant qu'il n'est pas soumis
- Upload documents autorise: `pdf`, `jpg`, `jpeg` (max 4MB)
- Messagerie: marquage des demandes de paiement manuel
- Paiement manuel: enregistrement admin via RPC `record_manual_payment`

## Notes

- Le bucket attendu est `documents-licences`.
- Les RPC admin doivent etre deja presentes en base:
  - `send_ffbb_link`
  - `validate_document`
  - `reject_document`
  - `mark_ffbb_payment_confirmed`
  - `mark_ffbb_registration_completed`
  - `record_manual_payment`
- Script de durcissement SQL phase 3:
  - `supabase/migrations/20260319_phase3_security.sql`
  - a executer dans Supabase SQL Editor (ou via Supabase CLI) sur la base cible.

# DevHub Backend — première étape

Ce dossier contient le début du backend réel de DevHub. Il complète le frontend existant et expose une API JSON alignée sur les contrats principaux de `BACKEND.md`.

## Contenu actuel

- Express et configuration d'environnement validée avec Zod.
- Prisma et schéma PostgreSQL initial pour les utilisateurs et les projets.
- Sessions persistées dans PostgreSQL via `connect-pg-simple`.
- Inscription, connexion, session courante et déconnexion.
- Lecture, création, modification et suppression de projets.
- Route `GET /health` qui vérifie PostgreSQL.
- CORS limité à `FRONTEND_URL`, cookies HttpOnly et limitation des tentatives de connexion.

Ce n'est pas encore le backend complet : articles, cours, publications, commentaires, messagerie, notifications, uploads et plusieurs fonctions d'administration restent à implémenter. La connexion Google via Firebase est préparée, mais nécessite encore les secrets et l'activation du fournisseur. Les contrôles de modération et les permissions devront être complétés et testés avant une mise en production.

## Démarrer dans GitHub Codespaces sans fichier .env

Pour éviter de créer un fichier contenant les secrets, suis le guide [CODESPACES.md](./CODESPACES.md). Il explique comment enregistrer les variables dans **GitHub Settings → Codespaces → Secrets**, puis lancer le backend. Les variables secrètes sont injectées dans l'environnement du Codespace et ne doivent pas être ajoutées au dépôt.

## Installation locale

1. Installer Node.js 20 ou plus récent.
2. Copier `.env.example` vers `.env` et renseigner les URL Supabase localement. Ne jamais committer `.env`.
3. Depuis ce dossier :

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

4. Vérifier `GET http://localhost:4000/health`. Une réponse `{ "status": "ok", "database": "connected" }` confirme que le serveur et Prisma atteignent PostgreSQL.
5. Dans le fichier `.env` du frontend, définir `VITE_API_URL=http://localhost:4000`, puis redémarrer Vite.

## Supabase

Dans Supabase, ouvre **Connect → Session pooler** pour récupérer l'URI PostgreSQL. Utilise des URL compatibles Prisma pour `DATABASE_URL` et `DIRECT_URL`, puis les paramètres du Session Pooler pour `SESSION_DATABASE_URL`. Pour le premier test, le guide Codespaces explique comment utiliser l'URI Session Pooler pour les trois variables. Ne publie jamais ces URL : elles peuvent contenir le mot de passe de la base.

Pour le déploiement, configure les variables dans les paramètres privés de l'hébergeur. Définis `NODE_ENV=production`, un `SESSION_SECRET` aléatoire d'au moins 32 caractères et l'origine exacte du frontend dans `FRONTEND_URL`. HTTPS est obligatoire en production.


## Firebase Authentication (Google)

La route `POST /auth/firebase` reçoit un ID token Firebase, vérifie sa signature, sa révocation et son projet avec Firebase Admin, exige une adresse Google vérifiée, puis crée/lie le compte DevHub et ouvre une session PostgreSQL. L'identifiant Firebase est conservé dans `users.firebase_uid` (nullable et unique) ; les comptes existants gardent leur identifiant DevHub.

Variables backend à configurer dans les secrets de l'hébergeur :
- `FIREBASE_PROJECT_ID=devhub-95d5c`
- `FIREBASE_SERVICE_ACCOUNT_JSON` : contenu JSON complet du compte de service Firebase, stocké comme secret privé.

Ne place jamais le compte de service dans le frontend ou dans Git. Active Google dans Firebase Authentication et ajoute les domaines du frontend dans les domaines autorisés.

Le schéma Prisma a été étendu avec `firebaseUid`. Avant de déployer ce code, applique le changement sur une base de test isolée avec `npm run db:push`. N'exécute pas cette commande sur la base de production sans sauvegarde, validation et autorisation explicite.

## Contrat frontend

Le frontend existant utilise `VITE_API_URL`. Les erreurs API suivent `{ "message": "..." }`, conformément à `BACKEND.md`. La session est portée par cookie ; aucun jeton de session n'est renvoyé au navigateur.

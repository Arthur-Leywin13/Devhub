# DevHub — Frontend

Plateforme communautaire tech multi-utilisateurs (Wikipédia + GitHub + réseau social). Frontend React + Vite + Tailwind, dark mode, **prêt à être branché à un backend sans réécrire les pages**.

```
Utilisateur → Frontend DevHub → Couche API (src/api/) → Backend  (ou mocks en développement)
```

Aucune page ni composant n'importe de données ou de `fetch` : tout passe par `src/api/`.
- `VITE_API_URL` **absente** → mode mock (`src/mocks/`, données génériques, latence simulée).
- `VITE_API_URL` **définie** → chaque module appelle le vrai backend via `src/api/client.js`.

## Démarrage

```bash
npm install
cp .env.example .env     # laisser VITE_API_URL vide pour rester en mode mock
npm run dev              # http://localhost:5173
npm run build && npm run preview   # production
```
Dépendances : `react`, `react-dom`, `react-router-dom`, `lucide-react` + `vite`, `tailwindcss`, `postcss`, `autoprefixer`.

**Mode mock** : la connexion accepte n'importe quel mot de passe. Comptes de test (saisir le pseudo) : `utilisateur1` = **administrateur** · `utilisateur3` = **modérateur** · `utilisateur2`, `utilisateur4` = créateurs (`utilisateur4` a un avertissement à confirmer). Google ouvre `utilisateur1` en mode mock. Les données et les fichiers envoyés ne survivent pas au rechargement de la page.


## Firebase Authentication (Google)

Le bouton Google utilise Firebase Authentication côté navigateur, puis transmet un ID token au backend. Le backend le vérifie avec Firebase Admin, associe l'identité Firebase au compte DevHub (ou crée le compte au premier passage), puis ouvre la session habituelle avec le cookie HttpOnly. Le navigateur ne reçoit jamais de clé de service Firebase.

1. Dans Firebase Console, ouvre le projet `devhub-95d5c` et active **Authentication → Sign-in method → Google**.
2. Dans **Authentication → Settings → Authorized domains**, ajoute le domaine exact du frontend de production et les domaines de développement nécessaires.
3. Renseigne les variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` et `VITE_FIREBASE_APP_ID` dans l'environnement du frontend. Les valeurs Web Firebase sont des paramètres client publics ; ne mets jamais le JSON de compte de service dans le frontend.
4. Dans Firebase Console → **Project settings → Service accounts**, génère une clé privée. Place le JSON complet dans le secret backend `FIREBASE_SERVICE_ACCOUNT_JSON` et définis `FIREBASE_PROJECT_ID=devhub-95d5c`. Ne commite jamais ce JSON.
5. Après configuration du backend, applique le nouveau champ nullable `users.firebase_uid` à la base PostgreSQL de test avec `npm run db:push` depuis `backend/`. Vérifie d'abord que `DATABASE_URL` et `DIRECT_URL` pointent vers la base de test, jamais vers la production.
6. Déploie le frontend et le backend, puis teste un premier compte Google, une reconnexion, une déconnexion et la liaison d'une adresse e-mail déjà utilisée.

La première connexion Google crée un compte DevHub si l'adresse vérifiée n'existe pas encore. Si l'adresse correspond à un compte existant, l'identité Firebase est liée à ce compte. Les comptes bannis restent refusés. GitHub OAuth n'est pas activé dans cette intégration.

## Fonctionnalités

- **Comptes** : connexion/inscription, connexion Google via Firebase Authentication (jeton vérifié côté backend puis session DevHub HttpOnly), routes publiques/privées, rôles (utilisateur, créateur, modérateur, administrateur).
- **Projets** : publication avec images (galerie), **vidéo**, fichiers téléchargeables, liens validés, licence (« Aucune » par défaut) ; import GitHub ; likes, commentaires, sauvegarde, partage.
- **Articles, encyclopédie (catégories cliquables), cours** : sections et leçons **vidéo / texte / vidéo + texte** réellement renseignables, progression.
- **Fil d'actualité** : publications avec texte, **image ou vidéo, lien** (aperçu), projet/article lié ; page dédiée par publication avec **commentaires** et partage.
- **Messagerie privée** : texte, images, audio, vidéo, emoji, **stickers et GIFs créés par les utilisateurs**, liens cliquables, **fond d'écran de discussion** (6 fonds fournis + import d'une image perso).
- **Espace d'administration** (`/admin`, modérateurs et administrateurs) : tableau de bord, utilisateurs, **avertir / suspendre / bannir / rétablir**, changement de rôle, signalements, contenus, journal d'audit. Compte suspendu = lecture seule (bandeau), avertissements à confirmer, compte banni = écran dédié.
- **Signalement** de projets, articles, publications, commentaires, profils et messages (« Signaler »).
- **Messages** modifiables (« modifié »), supprimables, conversation supprimable pour soi.
- **Enregistrés** (projets, articles, publications, avec retrait), notifications (non lues, lecture individuelle), recherche, profils (suivre / message).
- **États de données** partout : chargement (squelettes), vide, erreur avec « Réessayer ».
- **Sécurité côté client** : liens `http(s)` uniquement (`rel="noopener noreferrer nofollow"`), aucun HTML utilisateur interprété, validation de type/taille des fichiers.

## Structure

```
src/
├── api/          Couche API — jamais de fetch() ailleurs
│   ├── client.js  mode.js  mockSession.js  uploads.js
│   ├── auth.js users.js projects.js articles.js courses.js posts.js comments.js
│   ├── notifications.js messages.js stickers.js gifs.js technologies.js search.js
│   └── *Cache.js   petits caches mémoire (auteurs, projets, articles, posts, technologies)
├── mocks/        Données de test génériques — supprimables
├── context/      AuthContext (session)
├── firebase.js   Firebase Web SDK (Google sign-in)
├── hooks/        useAuth, useAsync, useProjects, useArticles, useCourses, usePosts,
│                 useMessages, useStickers, useGifs, useNotifications, useAuthor...
├── lib/          url.js (validation de liens), attachments.js (validation + upload),
│                 wallpapers.js, share.js, emojis.js, timeAgo.js
├── components/
│   ├── ui/        Skeleton, EmptyState, ErrorState, DataState, Linkify
│   ├── chat/      PickerButton, EmojiPicker, MediaPicker, WallpaperPicker
│   ├── forms/     MediaUploader, FileUploader
│   └── ...        Sidebar, Header, cartes, CommentSection, LinkCard, ShareButton...
├── layouts/      AppLayout (3 colonnes), AuthLayout
└── pages/        une page par route
public/wallpapers/  6 fonds d'écran SVG de discussion
```

## Routes

**Publiques** : `/`, `/explorer`, `/encyclopedie`, `/encyclopedie/:id`, `/cours`, `/cours/:id`, `/cours/:courseId/lecon/:lessonId`, `/projets`, `/projets/:id`, `/articles/:id`, `/fil`, `/publications/:id`, `/profil/:username`, `/aide`, `/connexion`, `/inscription`

**Équipe de modération** (`moderator`, `admin`) : `/admin`, `/admin/utilisateurs`, `/admin/utilisateurs/:id`, `/admin/signalements`, `/admin/contenus`, `/admin/journal`

**Privées** (redirigent vers `/connexion`) : `/mon-profil`, `/mes-projets`, `/mes-cours`, `/enregistres`, `/messages`, `/messages/:id`, `/notifications`, `/parametres`, `/creer`, `/projets/nouveau`, `/projets/importer-github`, `/articles/nouveau`, `/cours/nouveau`

## Brancher le backend

1. Définir `VITE_API_URL` dans `.env`.
2. Aligner l'API sur `BACKEND.md` (modèles, endpoints, uploads, OAuth, sécurité) ; `DATABASE.txt` résume les tables.
3. **Uploads** : le frontend appelle déjà `POST /uploads` (multipart) en mode live ; il suffit que l'endpoint existe.
4. **OAuth** : les boutons Google/GitHub redirigent vers `${VITE_API_URL}/auth/{google|github}?redirect=…` ; tout le flux est côté backend.
5. Supprimer `src/mocks/` une fois le backend validé.

## Documents pour l'équipe backend

- `BACKEND.md` — contrat complet de l'API (la section 16 décrit l'administration et la modération).
- `DATABASE.txt` — tables, champs, relations.

## Identité visuelle

Dark mode quasi noir (`#0A0E14`), cartes légèrement plus claires, accent bleu plein (`#3B7DFB`), Space Grotesk (titres) / Inter (texte) / JetBrains Mono (badges).

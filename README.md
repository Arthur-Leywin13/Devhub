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

**Mode mock** : la connexion accepte n'importe quel mot de passe. Comptes de test (saisir le pseudo) : `utilisateur1` = **administrateur** · `utilisateur3` = **modérateur** · `utilisateur2`, `utilisateur4` = créateurs (`utilisateur4` a un avertissement à confirmer). Google/GitHub ouvrent `utilisateur1`. Les données et les fichiers envoyés ne survivent pas au rechargement de la page.

## Fonctionnalités

- **Comptes** : connexion/inscription, **Google et GitHub (OAuth)**, routes publiques/privées, rôles (utilisateur, créateur, modérateur, administrateur).
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

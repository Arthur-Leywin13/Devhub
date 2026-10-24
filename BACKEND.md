# DevHub — Guide d'intégration pour l'équipe backend

Ce document décrit ce que le frontend attend de l'API : modèles, endpoints, formats, authentification, uploads, erreurs et exigences de sécurité. Chaque contrat est déjà respecté côté frontend par l'adaptateur mock (`src/mocks/`) : reproduire ces formes exactes permet de brancher `VITE_API_URL` sans toucher au code frontend. La version condensée « base de données » est dans `DATABASE.txt`.

---

## 1. Principe de connexion

Le frontend n'appelle que `src/api/*.js`. Sans `VITE_API_URL` (fichier `.env`), ces modules utilisent l'adaptateur mock. Dès qu'elle est définie, ils appellent `src/api/client.js` : un `fetch` vers `${VITE_API_URL}${chemin}` avec `credentials: 'include'`.

**Conséquences :**
- CORS : origine explicite (pas `*`) + `Access-Control-Allow-Credentials: true`.
- Authentification **par cookie de session** (le frontend ne stocke aucun token). Avec du JWT, le placer dans un cookie `HttpOnly; Secure`.
- Requêtes/réponses en JSON (`application/json`), sauf `POST /uploads` (multipart).
- Noms de champs en **camelCase** dans l'API (les colonnes SQL peuvent rester en snake_case).

## 2. Format d'erreur

```json
{ "message": "Texte en français, affichable tel quel à l'utilisateur" }
```
- **401** sur `GET /auth/me` = « non connecté » (pas une erreur).
- **404** sur `GET /projects/:id`, `/articles/:id`, `/courses/:id`, `/posts/:id`, `/users/:username`, `/conversations/:id` → écran « introuvable ». À respecter.
- **413** fichier trop volumineux, **415** type non supporté, **429** trop de requêtes : le `message` est affiché dans un bandeau d'erreur.

## 3. Authentification

### 3.1 Email / mot de passe

| Méthode | Chemin | Body | Réponse |
|---|---|---|---|
| POST | `/auth/login` | `{ emailOrUsername, password }` | `{ user }` + cookie de session — **403** si le compte est banni |
| POST | `/auth/register` | `{ username, email, password }` | `{ user }` + cookie de session |
| POST | `/auth/logout` | — | 204 |
| GET | `/auth/me` | — | `User` ou **401** (appelé à chaque chargement) ; un compte banni reçoit son `User` avec `status: 'banned'` (voir 16.2) |

### 3.2 Connexion Google / GitHub (OAuth)

Le frontend ne fait **qu'une redirection de page** — tout le flux OAuth est côté backend (les secrets ne quittent jamais le serveur).

```js
window.location.href = `${API_URL}/auth/${provider}?redirect=/chemin-d-origine`   // provider = google | github
```

Flux attendu :
1. `GET /auth/:provider?redirect=…` — valider `redirect` (chemin relatif commençant par `/`, jamais `//` ni URL absolue : anti open-redirect, sinon `/`), le mémoriser, rediriger vers le consentement du fournisseur avec un `state` anti-CSRF.
2. `GET /auth/:provider/callback?code&state` — vérifier `state`, échanger le `code`, récupérer id fournisseur, **email vérifié**, nom, avatar.
3. Résolution du compte : identité déjà connue → connexion ; sinon email vérifié correspondant à un compte existant → rattacher l'identité ; sinon créer l'utilisateur (username dérivé du pseudo/email, rendu unique ; `password_hash` NULL).
4. Poser le cookie de session, puis `302` vers `${FRONTEND_URL}${redirect}`.
5. En cas d'échec : `302` vers `${FRONTEND_URL}/connexion?error=oauth_failed` (le frontend affiche un message).

À configurer : client OAuth Google (Google Cloud Console, scopes `openid email profile`) et OAuth App GitHub (scopes `read:user user:email` ; l'email GitHub peut être privé → utiliser `/user/emails`, email principal vérifié). URI de callback = route backend ci-dessus. Variables d'environnement : `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, `FRONTEND_URL`.
Cookies : si front et API sont sur des sous-domaines du même site (`app.` / `api.`), `Domain=.exemple.com; SameSite=Lax; Secure; HttpOnly` ; si sites différents, `SameSite=None; Secure`.

## 4. `User`

```ts
{ id, username /* unique */, name, avatarUrl, bio, role: 'user'|'creator'|'moderator'|'admin',
  status: 'active'|'suspended'|'banned', statusReason: string|null, suspendedUntil: string|null,
  followersCount, followingCount, createdAt }
```
L'email n'est **jamais** renvoyé publiquement.

| Méthode | Chemin | Réponse |
|---|---|---|
| GET | `/users/:username` | `User` ou **404** (404 aussi pour un compte banni, sauf pour le staff) |
| GET | `/users/id/:id` | `User` |
| GET | `/users/suggested?limit=&exclude=` | `User[]` |
| PATCH | `/me` body `{ name?, bio?, avatarUrl? }` | `User` |
| POST / DELETE | `/users/:id/follow` | 204 |
| GET | `/users/:id/follow-status` | `{ following: boolean }` |

## 5. `Project`

```ts
{
  id, slug, name, description /* court */, longDescription,
  image,                  // couverture (= images[0], ou image par défaut)
  images: string[],       // galerie (peut être vide)
  video: string | null,   // vidéo de présentation
  files: { name, size, url }[],   // fichiers téléchargeables
  authorId, tech: string[] /* ids Technology */, category,
  github: string | null, demo: string | null,
  licence,                // "Aucune" (défaut) | "MIT" | "Apache 2.0" | "GPL v3" | "Propriétaire"
  allowDownload: boolean,
  likesCount, likedByCurrentUser, savedByCurrentUser /* au moins sur le détail */,
  commentsCount, stars, createdAt
}
```
Les URLs `image/images/video/files[].url` proviennent de `POST /uploads` (section 15). `github`/`demo` : valider côté serveur (http/https uniquement).

| Méthode | Chemin | Réponse |
|---|---|---|
| GET | `/projects?authorId=&category=&q=&sort=recent\|popular` | `Project[]` |
| GET | `/projects/:id` (id **ou** slug) | `Project` ou 404 |
| POST | `/projects` | `Project` créé |
| PATCH / DELETE | `/projects/:id` | `Project` / 204 |
| POST / DELETE | `/projects/:id/like` | `Project` mis à jour |
| POST / DELETE | `/projects/:id/save` | `{ saved: boolean }` |

## 6. `Article`

```ts
{ id, slug, title, excerpt, content, category, authorId, image, readTime,
  likesCount, likedByCurrentUser, savedByCurrentUser /* détail */, commentsCount, createdAt }
```
| Méthode | Chemin | Réponse |
|---|---|---|
| GET | `/articles?authorId=&category=&q=` | `Article[]` |
| GET | `/articles/:id` (id ou slug) | `Article` ou 404 |
| POST | `/articles` | `Article` |
| POST / DELETE | `/articles/:id/like` | `Article` |
| POST / DELETE | `/articles/:id/save` | `{ saved: boolean }` |

## 7. `Course` (sections et leçons imbriquées)

```ts
// Liste : sans sections
{ id, slug, title, description, image, authorId, category, level: 'Débutant'|'Intermédiaire'|'Avancé', studentsCount }
// Détail : + sections
{ ...Course, sections: [{ id, title, lessons: [{
    id, title, type: 'VIDEO'|'TEXT'|'VIDEO_TEXT',
    videoUrl: string|null,      // fourni par le créateur (upload 'lesson-video')
    content: string|null,       // texte de la leçon (types TEXT / VIDEO_TEXT)
    durationMin: number|null }] }] }
```
| Méthode | Chemin | Body | Réponse |
|---|---|---|---|
| GET | `/courses?authorId=&category=&q=` | — | `Course[]` |
| GET | `/courses/:id` (id ou slug) | — | `Course` complet ou 404 |
| GET | `/courses/:id/lessons/:lessonId` | — | `Lesson` + `courseId`, `sectionId` |
| POST | `/courses` | `{ title, description, category, level, authorId, image }` | `Course` |
| POST | `/courses/:id/sections` | `{ title }` | `Section` |
| POST | `/courses/:id/lessons` | `{ sectionId, title, type, content, videoUrl }` | `Lesson` |
| GET | `/courses/:id/progress` | — | `{ completedLessonIds, totalLessons, percent }` |
| POST | `/courses/:id/lessons/:lessonId/complete` | — | même forme que `progress` |

`:id` accepte l'`id` **ou** le `slug` (le frontend navigue avec le slug).

## 8. `Post` (fil d'actualité)

```ts
{
  id, authorId, content,
  image: string | null,    // une image OU une vidéo (pas les deux)
  video: string | null,
  link: { url, title?, description?, imageUrl? } | null,   // aperçu rempli par le serveur
  linkedProjectId, linkedArticleId,
  likesCount, likedByCurrentUser, savedByCurrentUser, commentsCount, createdAt
}
```
| Méthode | Chemin | Body | Réponse |
|---|---|---|---|
| GET | `/feed?authorId=` | — | `Post[]`, du plus récent au plus ancien |
| GET | `/posts/:id` | — | `Post` ou 404 (page `/publications/:id`, partage) |
| POST | `/posts` | `{ content, image?, video?, link?: { url }, linkedProjectId?, linkedArticleId? }` | `Post` (author = utilisateur connecté) |
| POST / DELETE | `/posts/:id/like` | — | `Post` |
| POST / DELETE | `/posts/:id/save` | — | `{ saved: boolean }` |

Validation : au moins un de `content`, `image`, `video`, `link` ; `content` ≤ 2000 caractères ; `image` et `video` mutuellement exclusifs.
**Aperçu de lien** : le serveur récupère les métadonnées OpenGraph (titre, description, image) de `link.url`, avec protections **SSRF** (refuser les IP privées/loopback/link-local, suivre au plus quelques redirections en revérifiant l'hôte, timeout court, taille de réponse limitée, http/https uniquement). Si l'aperçu échoue, renvoyer `link: { url }` seul : le frontend affiche alors le nom de domaine.

## 9. Enregistrés

```ts
SavedEntry { id, userId, targetType: 'project'|'article'|'post', targetId, createdAt }
```
| Méthode | Chemin | Réponse |
|---|---|---|
| GET | `/saved` | `SavedEntry[]` de l'utilisateur connecté |
| DELETE | `/saved/:id` | 204 |

(Création via `POST /{projects|articles|posts}/:id/save`.)

## 10. Commentaires

Génériques : `targetType` = `project` \| `article` \| `post`.

| Méthode | Chemin | Body | Réponse |
|---|---|---|---|
| GET | `/:targetType/:targetId/comments` | — | `Comment[]` (plus ancien → plus récent) |
| POST | `/:targetType/:targetId/comments` | `{ text }` (≤ 1000 car.) | `Comment` |
| DELETE | `/comments/:id` | — | 204 — auteur **ou** modérateur/admin |

```ts
Comment { id, targetType, targetId, authorId, text, createdAt }
```
⚠️ Ajouter/supprimer un commentaire doit mettre à jour **côté serveur** le `commentsCount` du projet/article/post.

## 11. Messagerie privée

```ts
Conversation {
  id, participantIds: string[] /* toujours 2 */, updatedAt,
  wallpaperUrl: string | null,   // fond d'écran de la discussion (voir ci-dessous)
  lastMessage?: Message | null,  // uniquement dans GET /conversations
  unreadCount?: number           // idem, pour l'utilisateur connecté
}
Message { id, conversationId, senderId, text, attachments: Attachment[], createdAt, read,
          editedAt: string|null,    // renseigné après modification : le frontend affiche « modifié »
          deletedAt: string|null }  // renseigné après suppression : text = '' et attachments = [] (le serveur ne renvoie JAMAIS le contenu d'un message supprimé)

Attachment =
  { type: 'image'|'audio'|'video', url, name }
| { type: 'gif', url, name }
| { type: 'sticker', stickerType: 'emoji'|'image', content, name }   // content = emoji ou URL d'image
```
| Méthode | Chemin | Body | Réponse |
|---|---|---|---|
| GET | `/conversations` | — | `Conversation[]` (tri `updatedAt` décroissant) |
| GET | `/conversations/:id` | — | `Conversation` ou 404 |
| POST | `/conversations` | `{ otherUserId }` | `Conversation` (existante ou créée) |
| PATCH | `/conversations/:id` | `{ wallpaperUrl }` | `Conversation` |
| GET | `/conversations/:id/messages` | — | `Message[]` (ancien → récent) |
| POST | `/conversations/:id/messages` | `{ text, attachments }` | `Message` (`senderId` = utilisateur connecté) |
| PATCH | `/conversations/:id/messages/:messageId` | `{ text }` | `Message` avec `editedAt` — **auteur uniquement**, texte uniquement, jamais sur un message supprimé (409) ; texte vide refusé si pas de pièce jointe ; 4000 car. max |
| DELETE | `/conversations/:id/messages/:messageId` | — | 204 — **auteur uniquement** ; le contenu et les pièces jointes sont effacés **pour tous**, le message devient « Message supprimé » dans le fil |
| DELETE | `/conversations/:id` | — | 204 — supprime la conversation **pour moi uniquement** : l'historique antérieur n'est plus montré à ce participant (`cleared_at` par participant), l'autre participant garde tout ; un nouveau message la fait réapparaître avec les seuls messages postérieurs |
| POST | `/conversations/:id/read` | — | 204 (marque comme lus les messages **reçus**) |

**Fond d'écran** : `wallpaperUrl` vaut `null` (fond par défaut), un chemin relatif `/wallpapers/<nom>.svg` (6 fonds fournis avec le frontend : grille, aurore, circuit, points, vagues, nuit — à accepter tel quel), ou l'URL d'une image uploadée (`purpose: 'wallpaper'`). Valider : chemin commençant par `/wallpapers/` ou URL de votre propre stockage. Le réglage est **par conversation** (propre à la discussion ; décider si chaque participant a le sien).
Seuls les participants accèdent à une conversation (403 sinon). Les pièces jointes doivent déjà être uploadées : jamais de binaire dans ce body.

## 12. Stickers et GIFs

Les utilisateurs **créent** leurs propres stickers et GIFs, réutilisables dans toutes leurs conversations.

```ts
Sticker { id, authorId: string|null /* null = fourni par la plateforme */, type: 'emoji'|'image', content, name, createdAt }
Gif     { id, authorId: string|null, url, name, createdAt }
```
| Méthode | Chemin | Body | Réponse |
|---|---|---|---|
| GET | `/stickers` | — | `Sticker[]` : plateforme + ceux de l'utilisateur connecté |
| POST | `/stickers` | `{ type, content, name }` | `Sticker` |
| DELETE | `/stickers/:id` | — | 204 (créateur uniquement) |
| GET / POST / DELETE | `/gifs`, `/gifs/:id` | `{ url, name }` | idem (fichiers `.gif` uniquement, ≤ 15 Mo) |

La bibliothèque de GIFs démarre vide ; une recherche externe (Giphy/Tenor) pourra s'y ajouter plus tard.

## 13. Notifications

```ts
{ id, userId, type: 'like'|'comment'|'follow'|'mention'|'course'|'warning'|'suspension'|'restore',
  actorId: string|null,   // null pour les types de modération (l'identité du modérateur n'est jamais exposée)
  targetLabel: string|null /* pour la modération : le motif */, read, createdAt }
```
| Méthode | Chemin | Réponse |
|---|---|---|
| GET | `/notifications` | `Notification[]` (récent → ancien) |
| POST | `/notifications/:id/read` | 204 |
| POST | `/notifications/read-all` | 204 |

## 14. Technologies, catégories, recherche

```ts
Technology { id, name, color /* hex */ }
Category   { id, name, icon /* nom d'icône Lucide : "Code2", "BrainCircuit"... */, articleCount, description }
```
`GET /technologies`, `GET /categories`, et `GET /search?q=&category=` →
`{ projects: Project[], articles: Article[], users: User[], technologies: Technology[], courses: Course[] }`.
Les catégories ne sont pas figées : un admin doit pouvoir en ajouter.

## 15. Uploads

Tous les fichiers (avatar, images/vidéo/fichiers de projet, médias de publication, pièces jointes de chat, stickers, GIFs, fonds d'écran, vidéos de leçon) passent par **un seul endpoint** ; le frontend envoie le fichier dès sa sélection, puis n'utilise plus que l'URL renvoyée dans les payloads JSON.

```
POST /uploads            multipart/form-data : file (binaire), purpose (texte)
→ 201 { id, url, mimeType, sizeBytes, name }
```
`purpose` : `avatar` · `project-image` · `project-video` · `project-file` · `post-media` · `chat-attachment` · `sticker` · `gif` · `wallpaper` · `lesson-video` · `generic`.

**Limites (le frontend applique les mêmes par confort ; le backend DOIT les imposer)** : image 10 Mo · GIF 15 Mo · audio 25 Mo · vidéo 100 Mo · fichier de projet 100 Mo. Erreurs : 413 (taille), 415 (type), 401 (non connecté).
Types acceptés : `image/jpeg|png|webp|gif`, `audio/mpeg|mp4|ogg|wav|webm`, `video/mp4|webm|quicktime`. **Refuser le SVG** envoyé par les utilisateurs (vecteur XSS) ou le sanitiser.

Exigences : vérifier le type réel (magic bytes) et non l'extension · retirer les métadonnées EXIF des images · antivirus sur les fichiers de projet · servir les fichiers depuis un domaine/CDN dédié (jamais le domaine de l'app) avec `Content-Disposition: attachment` pour les téléchargements · quotas par utilisateur · rattacher chaque fichier à son propriétaire (table `files`) pour pouvoir le supprimer avec le compte.
En mode mock actuel, le frontend utilise des URLs locales temporaires (`URL.createObjectURL`), perdues au rechargement.

## 16. Administration et modération

Le frontend fournit un **espace d'administration** (`/admin`) réservé aux rôles `moderator` et `admin`, plus le signalement côté utilisateurs. Tout ce qui suit doit être **appliqué par le backend** : cacher un bouton n'est pas une protection.

### 16.1 Permissions

Rangs : `user` < `creator` < `moderator` < `admin`.

| Action | Modérateur | Administrateur |
|---|---|---|
| Voir tableau de bord, utilisateurs, signalements, contenus, journal | oui | oui |
| Avertir · suspendre · rétablir une suspension | oui | oui |
| Supprimer un contenu public (projet, article, publication, commentaire, cours) | oui | oui |
| Traiter / rejeter un signalement | oui (actions permises) | oui |
| **Bannir** · **lever un bannissement** | non | oui |
| **Changer le rôle** d'un compte | non | oui |

Règles communes à toute sanction : **motif obligatoire** (5 à 500 caractères) · on ne sanctionne **jamais son propre compte** · ni un compte de **rang égal ou supérieur** (un admin ne peut donc pas sanctionner un autre admin) · on ne modifie jamais son propre rôle (évite de se retirer l'accès) · chaque action est écrite dans le **journal d'audit** (16.8). Réponses : 401 non connecté, 403 interdit (avec `message`), 404 introuvable, 409 état incompatible (ex. déjà banni).

### 16.2 Statut du compte

Champs ajoutés au `User` : `status: 'active' | 'suspended' | 'banned'`, `statusReason: string | null`, `suspendedUntil: string | null` (ISO).

- **Suspendu** (durée 1 à 365 jours) : le compte est en **lecture seule**. Le backend répond **403** avec un `message` lisible sur toute écriture : publier, commenter, aimer, enregistrer, suivre, créer projet/article/cours, envoyer/modifier/supprimer un message, changer de fond d'écran, modifier son profil. Restent autorisés : lecture, **signalement**, confirmation d'un avertissement, déconnexion. La suspension **expire seule** : levée à la lecture ou par tâche planifiée (`suspendedUntil` dépassé → `active`).
- **Banni** : toutes les sessions sont invalidées ; `POST /auth/login` répond **403** (`{ message: "Ce compte a été banni. Motif : …" }`). Si un banni garde un cookie : tout répond 403 sauf `GET /auth/me` (renvoie son `User` avec `status: 'banned'`, pour afficher l'écran de bannissement) et `POST /auth/logout`. Le compte disparaît du site pour le public : `GET /users/:username` → **404** (sauf pour le staff), exclu de la recherche et des suggestions ; décider de la visibilité de ses contenus (masqués ou conservés).
- Un compte banni ou suspendu reste visible dans `GET /admin/users`.

### 16.3 Avertissements

```ts
Warning { id, userId, moderatorId, reason, createdAt, acknowledgedAt: string | null }
```
| Méthode | Chemin | Réponse |
|---|---|---|
| GET | `/me/warnings?unacknowledged=true` | `Warning[]` (sans `moderatorId` : l'identité du modérateur n'est jamais montrée à l'utilisateur) |
| POST | `/me/warnings/:id/acknowledge` | 204 |

À chaque visite, le frontend affiche les avertissements non lus dans une fenêtre qu'il faut confirmer (« J'ai compris »). Un avertissement crée aussi une notification (section 13).

### 16.4 Signalements (côté utilisateurs)

| Méthode | Chemin | Body | Réponse |
|---|---|---|---|
| POST | `/reports` | `{ targetType, targetId, reason, details?, context? }` | 201 `{ id }` |

- `targetType` : `user` · `project` · `article` · `post` · `comment` · `message` · `course`.
- `reason` : `spam` · `harassment` · `inappropriate` · `impersonation` · `illegal` · `other`. `details` ≤ 500 caractères.
- `context` : `{ conversationId }` pour un message privé. **Le serveur doit capturer une copie du message au moment du signalement** (texte, types de pièces jointes, auteur, date) : l'auteur peut ensuite le modifier ou le supprimer.
- Refuser de se signaler soi-même (400) ; autorisé même pour un compte suspendu ; limiter le débit (anti-abus) ; dédoublonner si besoin.

### 16.5 Endpoints d'administration (rôle moderator ou admin, sinon 403)

| Méthode | Chemin | Body / Query | Réponse |
|---|---|---|---|
| GET | `/admin/stats` | — | `{ users: { total, newLast7Days, suspended, banned }, reports: { open }, warningsLast30Days, content: { projects, articles, posts, courses } }` |
| GET | `/admin/users` | `?q=&status=&role=` | `AdminUser[]` |
| GET | `/admin/users/:id` | — | `{ user: AdminUser, warnings: (Warning + moderator)[], sanctions: AuditEntry[], contentCounts: { projects, articles, posts, comments, courses } }` |
| POST | `/admin/users/:id/warn` | `{ reason }` | `Warning` |
| POST | `/admin/users/:id/suspend` | `{ reason, durationDays }` | `AdminUser` |
| POST | `/admin/users/:id/ban` | `{ reason }` | `AdminUser` — **admin uniquement** |
| POST | `/admin/users/:id/restore` | `{ reason }` | `AdminUser` — lève une suspension ; un bannissement = **admin uniquement** |
| PATCH | `/admin/users/:id/role` | `{ role }` | `AdminUser` — **admin uniquement** |
| GET | `/admin/reports` | `?status=open\|resolved\|dismissed` | `Report[]` |
| POST | `/admin/reports/:id/resolve` | `{ action, reason, durationDays?, deleteContent? }` | `Report` |
| POST | `/admin/reports/:id/dismiss` | `{ reason? }` | `Report` |
| GET | `/admin/content` | `?type=project\|article\|post\|comment\|course&q=` | `ContentItem[]` |
| POST | `/admin/content/:type/:id/remove` | `{ reason }` | 204 |
| GET | `/admin/audit-log` | `?action=&targetUserId=&actorId=` | `AuditEntry[]` |

`resolve` : `action` ∈ `none` · `delete_content` · `warn` · `suspend` · `ban` ; `deleteContent: true` supprime en plus le contenu signalé (avec `warn`/`suspend`/`ban`). **Tout vérifier avant d'agir** (rang, rôle, existence) : un refus ne doit jamais laisser une action appliquée à moitié. Un signalement n'est traité qu'une fois (409 ensuite). `delete_content` est refusé pour `targetType: 'user'`.

### 16.6 Modèles

```ts
AdminUser   = User + { email, warningsCount }              // l'email n'est visible que dans l'admin
Report {
  id, reporterId, targetType, targetId, reason, details, context,
  status: 'open'|'resolved'|'dismissed',
  resolution: 'none'|'delete_content'|'warn'|'suspend'|'ban' | null,
  resolvedBy, resolvedAt, note, createdAt,
  // enrichi par le serveur pour l'affichage :
  reporter: { id, username } | null,
  target: { label, excerpt, authorId, link, missing? },     // link = chemin frontend, null pour un message privé
  targetAuthor: { id, username, role, status } | null,      // sert au frontend à proposer uniquement les actions permises
  resolver: { id, username } | null
}
ContentItem { type, id, title, excerpt, authorId, author: { id, username } | null, createdAt, link }
AuditEntry  { id, actorId, actor, action, targetUserId, targetUser, targetType, targetId, reason, metadata, createdAt }
```

### 16.7 Confidentialité des messages privés

L'espace d'administration **ne permet pas de lire les conversations**. Un modérateur ne voit un message privé que s'il a été **signalé** (copie capturée au signalement, 16.4) ; il peut alors traiter le signalement (avertir, suspendre, bannir l'auteur, retirer le message). Tout accès plus large aux messages est une décision juridique (RGPD, CGU, base légale, durée de conservation) à encadrer et à journaliser avant toute implémentation.

### 16.8 Journal d'audit

Écriture seule (jamais modifiable ni supprimable depuis l'API). `action` ∈ `warn` · `suspend` · `ban` · `unsuspend` · `unban` · `role_change` · `delete_content` · `report_resolved` · `report_dismissed`. Chaque entrée garde : auteur, cible, motif, métadonnées (durée de suspension, ancien/nouveau rôle, action choisie…), date. À conserver même si le compte sanctionné est supprimé (obligations légales).

### 16.9 Premier administrateur

Aucune route publique ne permet de devenir administrateur. Le premier compte `admin` se crée par script/migration ou directement en base ; les suivants via `PATCH /admin/users/:id/role`. Prévoir une authentification renforcée (2FA) pour les rôles `moderator` et `admin`.

### 16.10 Comptes de test du mode mock

`utilisateur1` = administrateur · `utilisateur3` = modérateur · `utilisateur2` et `utilisateur4` = créateurs (connexion avec ce pseudo, n'importe quel mot de passe). `utilisateur4` a un avertissement non lu au départ. Le mock applique les mêmes règles que ci-dessus (58 vérifications automatisées) : il peut servir de référence de comportement.

## 17. Sécurité et exigences de production

- **Mots de passe** : Argon2id ou bcrypt ; jamais en clair ni dans les logs. Verrouillage/ralentissement après échecs de connexion.
- **Sessions** : cookies `HttpOnly; Secure; SameSite` ; rotation à la connexion ; invalidation à la déconnexion. Cookies + `credentials: include` ⇒ prévoir une **protection CSRF** (SameSite strict/lax + jeton ou vérification d'`Origin` sur les méthodes non sûres).
- **Autorisations** : toujours vérifier côté serveur (propriétaire du contenu, participant d'une conversation, rôle modérateur/admin) ; ne jamais se fier au frontend.
- **Contenu utilisateur** : stocké comme texte brut. Le frontend n'interprète jamais de HTML et ne rend cliquables que les liens `http(s)` (`rel="noopener noreferrer nofollow"`). Valider/limiter les champs (longueurs : nom de projet 80, description 5000, publication 2000, commentaire 1000, message 4000), refuser `javascript:`/`data:` dans tout champ URL.
- **Limitation de débit** : connexion/inscription, publications, commentaires, messages, uploads, création de stickers/GIFs.
- **Pagination** : prévoir `?page=&limit=` (ou curseur) sur toutes les listes dès maintenant.
- **Vie privée / RGPD** : email jamais public ; export et suppression de compte (contenus, fichiers, messages) ; journaux d'audit pour les actions de modération.
- **Modération** : voir section 16 (interface d'administration livrée côté frontend). Reste à prévoir : blocage entre utilisateurs, appels/contestations d'une sanction.
- **Observabilité** : logs structurés, identifiants de requête, métriques, sauvegardes de la base testées.
- **Transport** : HTTPS partout, HSTS, en-têtes de sécurité (CSP, `X-Content-Type-Options`).

## 18. Pas encore côté frontend (à anticiper dans le modèle)

- Pagination / scroll infini · blocage entre utilisateurs · mot de passe oublié (`POST /auth/forgot-password`, `POST /auth/reset-password`) · fil personnalisé (abonnements uniquement) · liste cliquable des abonnés/abonnements · réglages Apparence/Langue/Notifications/Confidentialité/Sécurité · notifications temps réel (WebSocket/SSE) pour la messagerie.
- Import GitHub réel : `POST /projects` reçoit aujourd'hui des métadonnées simulées ; prévoir `GET /github/repo?url=` (nom, description, README, langages, licence).

## 19. Où regarder

Chaque module `src/api/*.js` documente son contrat en en-tête de fichier ; les formes de données exactes sont dans `src/mocks/*.mock.js`.

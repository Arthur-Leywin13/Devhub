# DevHub — état d'implémentation

Ce fichier distingue le code présent dans la branche `feat/search-users-messaging-foundation` des opérations qui nécessitent un accès à l'environnement de déploiement ou une vérification manuelle.

## Changements de cette branche

- [x] Ajouter les profils publics, suggestions, suivi et désabonnement.
- [x] Ajouter `GET /search?q=&category=` pour rechercher les projets et utilisateurs présents en base.
- [x] Ajouter les modèles Prisma `Conversation`, `ConversationParticipant`, `Message`, `Article`, `Post`, `Comment`, `ProjectLike`, `ArticleLike`, `PostLike`, `SavedItem` et `Notification`.
- [x] Ajouter les routes d'articles, publications/fil, commentaires, likes, favoris et notifications.
- [x] Ajouter les routes de messagerie persistante : lister les conversations, créer/récupérer un échange direct, lire les messages, envoyer, modifier et supprimer logiquement les messages, marquer comme lu et retirer une conversation de sa propre liste.
- [x] Protéger les routes de messagerie par session et vérifier l'appartenance à la conversation.
- [x] Aligner l'adaptateur frontend de messagerie sur les contrats réels (userId/body, routes PATCH/DELETE et lecture).
- [x] Ajouter la modification du profil courant via `PATCH /users/me` et relier le frontend.
- [x] Faire échouer explicitement les pièces jointes et fonds d'écran en mode API réel tant que leur backend n'existe pas, plutôt que d'appeler des routes inexistantes.
- [x] Valider les UUID de conversation et les curseurs de pagination, et vérifier qu'un curseur appartient bien à la conversation demandée.
- [x] Ajouter des tests unitaires pour les validations des messages et identifiants.
- [x] Ajouter les contrôles CI backend et un build frontend.
- [x] Limiter la recherche à 60 requêtes par adresse IP sur 15 minutes.
- [x] Exclure des résultats de recherche les projets dont l'auteur n'est pas actif.
- [x] Masquer les profils publics et le suivi des comptes suspendus ou bannis.

## Routes de cours, administration et modération

- `GET /courses`, `GET /courses/:id`, `POST /courses`.
- `GET /courses/:id/progress` et `POST /courses/:courseId/lessons/:lessonId/complete`.
- `GET /courses/:courseId/lessons/:lessonId`, `POST /courses/:id/sections`, `POST /courses/:id/lessons`.
- `GET /admin/stats`, `GET /admin/users`, `GET /admin/users/:id`.
- `POST /admin/users/:id/warn|suspend|ban|restore`, `PATCH /admin/users/:id/role` avec contrôles de rôle et journalisation.
- `GET /admin/reports`, `POST /admin/reports/:id/resolve|dismiss`.
- `GET /admin/content`, `POST /admin/content/:type/:id/remove`, `GET /admin/audit-log`.
- `POST /reports`, `GET /me/warnings`, `POST /me/warnings/:id/acknowledge`.

## Routes de contenu et communauté

- `GET /articles`, `GET /articles/:id`, `POST /articles`.
- `GET /feed`, `GET /posts/:id`, `POST /posts`.
- `POST|DELETE /projects/:id/like`, `POST|DELETE /articles/:id/like`, `POST|DELETE /posts/:id/like`.
- `POST|DELETE /projects/:id/save`, `POST|DELETE /articles/:id/save`, `POST|DELETE /posts/:id/save`.
- `GET|POST /projects/:id/comments`, `GET|POST /articles/:id/comments`, `GET|POST /posts/:id/comments`, `DELETE /comments/:id`.
- `GET /saved`, `DELETE /saved/:id`.
- `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all`.
- `PATCH /users/me` — modifier le pseudo, nom affiché, bio et avatar du compte connecté.

## Routes de messagerie

- `GET /conversations` — conversations de l'utilisateur connecté.
- `POST /conversations` avec `{ "userId": "UUID" }` — créer ou retrouver une conversation directe avec un compte actif.
- `GET /conversations/:conversationId` — métadonnées de la conversation.
- `DELETE /conversations/:conversationId` — retirer la conversation de sa propre liste sans supprimer celle de l'autre participant.
- `GET /conversations/:conversationId/messages?limit=30&before=UUID` — lire une page de messages.
- `POST /conversations/:conversationId/messages` avec `{ "body": "..." }` — envoyer un message texte.
- `PATCH /conversations/messages/:messageId` avec `{ "body": "..." }` — modifier son propre message.
- `DELETE /conversations/messages/:messageId` — supprimer logiquement son propre message.
- `PATCH /conversations/:conversationId/read` — marquer la conversation comme lue pour soi.

## Vérifications restantes avant la production

- [x] Vérifier le résultat CI pour les contrôles backend, la génération Prisma, la validation du schéma et le build frontend.
- [ ] Exécuter les tests d'intégration avec deux ou trois comptes : accès non autorisé, membres, compte suspendu/banni, création simultanée, pagination, édition/suppression.
- [ ] Appliquer le schéma uniquement sur une base de test vérifiée et sauvegardée.
- [ ] Déployer le backend sur un environnement de test puis connecter le frontend à l'API de test.
- [ ] Tester la recherche, profils, suivi et messagerie avec deux comptes sur mobile et ordinateur.
- [ ] Ajouter pièces jointes, upload sécurisé, notifications temps réel, blocages et reçus de lecture détaillés.
- [x] Ajouter les modèles/routes réels pour les cours, sections, leçons et progression.
- [x] Ajouter les modèles/routes réels pour les signalements, avertissements, sanctions, journal d'audit et administration.
- [ ] Tester les permissions de modération et les flux administratifs avec plusieurs rôles.

## Limites connues — ne pas considérer comme terminé

- La messagerie en mode API réel est actuellement texte uniquement : pièces jointes, stickers, GIF et fonds d'écran ne sont pas persistés.
- Le statut de lecture est enregistré au niveau de chaque participant/conversation; il n'y a pas de reçu de lecture par message ni de temps réel.
- Les résultats de recherche pour articles, cours et technologies ne sont pas encore reliés à la base (le modèle Article existe désormais, mais la recherche doit être étendue).
- Les cours, sections, leçons et progressions sont désormais persistés, mais les parcours réels doivent encore être testés avec plusieurs comptes.
- Les routes d'administration et de modération existent; les tests d'intégration et les essais en environnement connecté restent à faire.
- Aucun test d'intégration contre une base, aucune migration appliquée sur Supabase et aucun déploiement n'ont été effectués par ces modifications.

## Recherche

`GET /search?q=arthur&category=...` renvoie `projects`, `users`, `articles`, `technologies` et `courses`. La recherche interroge encore seulement les projets et utilisateurs; l'indexation des articles sera ajoutée avec les tests de recherche.

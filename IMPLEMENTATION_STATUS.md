# DevHub — état d'implémentation

Ce fichier distingue le code présent dans la branche `feat/search-users-messaging-foundation` des opérations qui nécessitent un accès à l'environnement de déploiement ou une vérification manuelle.

## Changements de cette branche

- [x] Ajouter le modèle Prisma `UserFollow` avec une contrainte unique par paire d'utilisateurs.
- [x] Ajouter les profils publics, les suggestions, le suivi et le désabonnement.
- [x] Ajouter `GET /search?q=&category=` pour rechercher les projets et utilisateurs présents en base.
- [x] Ajouter les modèles Prisma `Conversation`, `ConversationParticipant` et `Message`.
- [x] Ajouter les routes de messagerie persistante : liste des conversations, création/récupération d'un échange direct, lecture paginée, envoi, modification et suppression logique des messages, marquage comme lu.
- [x] Protéger les routes de messagerie par session et vérifier l'appartenance à la conversation avant la lecture ou l'envoi.
- [x] Monter les routes dans Express et inclure les fichiers dans `npm run check`.

## Routes de messagerie ajoutées

- `GET /conversations` — conversations de l'utilisateur connecté.
- `POST /conversations` avec `{ "userId": "UUID" }` — créer ou retrouver une conversation directe avec un compte actif.
- `GET /conversations/:conversationId/messages?limit=30&before=UUID` — lire les messages, du plus ancien au plus récent dans la page.
- `POST /conversations/:conversationId/messages` avec `{ "body": "..." }` — envoyer un message texte.
- `PATCH /conversations/messages/:messageId` avec `{ "body": "..." }` — modifier son propre message.
- `DELETE /conversations/messages/:messageId` — supprimer logiquement son propre message.
- `PATCH /conversations/:conversationId/read` — marquer la conversation comme lue pour soi.

## À faire avant la production

- [ ] Récupérer la branche et exécuter `cd backend && npm run check`.
- [ ] Exécuter `npm run db:generate`.
- [ ] Valider le schéma Prisma et appliquer le changement uniquement sur une base de test après avoir vérifié la cible et la sauvegarde.
- [ ] Ajouter des tests d'intégration avec deux ou trois comptes réels : utilisateur non membre, membre, compte suspendu/banni, création simultanée d'une conversation, pagination, édition/suppression.
- [ ] Déployer le backend sur un environnement de test puis connecter le frontend à l'API de test.
- [ ] Tester la recherche, les profils et les actions de suivi avec deux comptes.
- [ ] Vérifier le rendu mobile/ordinateur et les erreurs réseau.

## Limites connues — ne pas considérer comme terminé

- Articles, cours et technologies renvoient encore des tableaux vides dans la recherche.
- Les pièces jointes, l'upload sécurisé, les notifications temps réel et les blocages entre utilisateurs ne sont pas implémentés.
- La messagerie backend n'est pas encore reliée à l'interface frontend.
- Le statut de lecture est enregistré au niveau de chaque participant/conversation; il n'y a pas encore de reçu de lecture par message ni de temps réel.
- La route de recherche n'a pas encore de limite de débit dédiée.
- L'espace d'administration frontend ne dispose pas encore de toutes les routes backend attendues.
- Aucun test d'intégration contre une base, aucune migration et aucun déploiement n'ont été effectués par ces modifications.

## Contrat de recherche

`GET /search?q=arthur&category=...` renvoie `projects`, `users`, `articles`, `technologies` et `courses`. Pour l'instant, seuls `projects` et `users` interrogent la base réelle. Une recherche vide renvoie des listes vides.

## Vérifications

`npm run check` ne vérifie que la syntaxe JavaScript. Il ne remplace ni `prisma validate`, ni la génération du client Prisma, ni des tests d'intégration.

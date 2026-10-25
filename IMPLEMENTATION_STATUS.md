# DevHub — état d'implémentation

Ce fichier distingue le code présent dans la branche `feat/search-users-messaging-foundation` des opérations qui nécessitent un accès à l'environnement de déploiement ou une vérification manuelle.

## Changements de cette branche

- [x] Ajouter les profils publics, suggestions, suivi et désabonnement.
- [x] Ajouter `GET /search?q=&category=` pour rechercher les projets et utilisateurs présents en base.
- [x] Ajouter les modèles Prisma `Conversation`, `ConversationParticipant` et `Message`.
- [x] Ajouter les routes de messagerie persistante : lister les conversations, créer/récupérer un échange direct, lire les messages, envoyer, modifier et supprimer logiquement les messages, marquer comme lu et retirer une conversation de sa propre liste.
- [x] Protéger les routes de messagerie par session et vérifier l'appartenance à la conversation.
- [x] Relier l'adaptateur frontend de messagerie à l'API réelle pour les conversations et messages texte.
- [x] Faire échouer explicitement les pièces jointes et fonds d'écran en mode API réel tant que leur backend n'existe pas, plutôt que d'appeler des routes inexistantes.
- [x] Valider les UUID de conversation et les curseurs de pagination, et vérifier qu'un curseur appartient bien à la conversation demandée.
- [x] Ajouter des tests unitaires pour les validations des messages et identifiants.
- [x] Ajouter les contrôles CI backend et un build frontend.

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

- [ ] Vérifier le résultat CI après les derniers changements frontend/backend, y compris les nouveaux tests unitaires.
- [ ] Exécuter les tests d'intégration avec deux ou trois comptes : accès non autorisé, membres, compte suspendu/banni, création simultanée, pagination, édition/suppression.
- [ ] Appliquer le schéma uniquement sur une base de test vérifiée et sauvegardée.
- [ ] Déployer le backend sur un environnement de test puis connecter le frontend à l'API de test.
- [ ] Tester la recherche, profils, suivi et messagerie avec deux comptes sur mobile et ordinateur.
- [ ] Ajouter pièces jointes, upload sécurisé, notifications temps réel, blocages et reçus de lecture détaillés.
- [ ] Ajouter des modèles/routes réels pour les articles, cours et technologies.
- [ ] Ajouter une limite de débit dédiée à la recherche et compléter les routes d'administration.

## Limites connues — ne pas considérer comme terminé

- La messagerie en mode API réel est actuellement texte uniquement : pièces jointes, stickers, GIF et fonds d'écran ne sont pas persistés.
- Le statut de lecture est enregistré au niveau de chaque participant/conversation; il n'y a pas de reçu de lecture par message ni de temps réel.
- Les résultats de recherche pour articles, cours et technologies restent des tableaux vides.
- Aucun test d'intégration contre une base, aucune migration et aucun déploiement n'ont été effectués par ces modifications.

## Recherche

`GET /search?q=arthur&category=...` renvoie `projects`, `users`, `articles`, `technologies` et `courses`. Seuls `projects` et `users` interrogent actuellement la base réelle.

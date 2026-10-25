# DevHub — état d'implémentation

Ce fichier distingue les changements déjà présents dans la branche `feat/search-users-messaging-foundation` des opérations qui nécessitent un accès à l'environnement de déploiement ou une vérification manuelle.

## Changements de cette branche

- [x] Ajouter un modèle Prisma `UserFollow` avec une contrainte unique par paire d'utilisateurs.
- [x] Ajouter les routes publiques de profil : `GET /users/:username`, `GET /users/id/:id` et `GET /users/suggested`.
- [x] Ajouter le suivi et le désabonnement : `POST /users/:id/follow`, `DELETE /users/:id/follow`, `GET /users/:id/follow-status`.
- [x] Ajouter `GET /search?q=&category=` pour rechercher dans les projets et les utilisateurs réels.
- [x] Monter les routes `/users` et `/search` dans Express.
- [x] Inclure les nouvelles routes dans le script de vérification syntaxique.

## À faire manuellement avant la mise en production

- [ ] Exécuter `npm run db:generate` dans le dossier `backend` après récupération de cette branche.
- [ ] Appliquer et vérifier le changement de schéma sur la base de test : `npm run db:push` dans `backend`. Vérifier la sauvegarde et la bonne base ciblée avant cette commande.
- [ ] Déployer le backend de cette branche sur un environnement de test, sans écraser la production.
- [ ] Configurer `VITE_API_URL` côté frontend pour qu'il pointe vers l'API de test, puis redéployer le frontend.
- [ ] Tester avec deux comptes réels : recherche par nom/pseudo, ouverture d'un profil, suivre, se désabonner, recharger la page et vérifier les compteurs.
- [ ] Tester les profils bannis, les UUID invalides, la recherche vide et les erreurs de base de données.
- [ ] Vérifier les résultats de recherche sur mobile et ordinateur.

## Limites connues — ne pas considérer comme terminé

- La recherche renvoie actuellement des tableaux vides pour les articles, cours et technologies : leurs modèles et routes backend ne sont pas encore connectés à la base.
- La modification du profil (`PATCH /me`) et certaines routes frontend de compte restent à implémenter.
- La messagerie privée n'est pas encore connectée à une base réelle. Il reste à créer les modèles Prisma des conversations, participants et messages, les routes `/conversations`, l'autorisation par participant, la persistance, la suppression/modification et le statut de lecture.
- Les pièces jointes, les notifications en temps réel et l'upload sécurisé ne sont pas implémentés ici.
- L'espace d'administration frontend n'est pas encore soutenu par des routes backend complètes.
- Aucun déploiement ni migration de base n'a été effectué par cette modification.

## Contrat de recherche

`GET /search?q=arthur&category=...` renvoie un objet avec les clés `projects`, `users`, `articles`, `technologies` et `courses`. Pour l'instant, seuls `projects` et `users` interrogent la base réelle. La recherche vide renvoie des listes vides afin d'éviter une requête trop large.

## Vérifications

Le script `npm run check` vérifie la syntaxe Node des fichiers backend connus. Il ne remplace pas des tests d'intégration, une validation Prisma, ni un essai contre la base de test.

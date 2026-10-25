# Configurer DevHub dans GitHub Codespaces sans fichier .env

Ce guide permet de lancer le backend sans créer ni publier de fichier `.env`. Codespaces injecte les secrets enregistrés dans les paramètres dans l'environnement du terminal.

## 1. Créer les secrets Codespaces

Depuis GitHub, ouvre **Settings → Codespaces → Secrets** dans les paramètres de ton compte. Crée les secrets suivants et autorise leur accès au dépôt `Arthur-Leywin13/Devhub` :

- `DATABASE_URL`
- `DIRECT_URL`
- `SESSION_DATABASE_URL`
- `SESSION_SECRET`

Pour les trois variables de base de données, copie la chaîne PostgreSQL affichée dans Supabase via **Connect → Session pooler**. Pour le premier démarrage, la même URI de pooler peut être utilisée pour les trois variables. Ne colle jamais ces valeurs dans un fichier suivi par Git, une issue, une pull request ou une conversation.

Pour `SESSION_SECRET`, utilise une valeur aléatoire longue d'au moins 32 caractères. Ne réutilise pas le mot de passe Supabase comme secret de session.

Après avoir créé ou modifié des secrets, arrête puis recrée/redémarre le Codespace pour que les variables soient injectées dans son environnement.

## 2. Variables non secrètes

Dans le terminal du Codespace, depuis le dépôt, configure uniquement les valeurs non sensibles pour la session courante :

```bash
export FRONTEND_URL="http://localhost:5173"
export PORT="4000"
export NODE_ENV="development"
cd backend
```

Ces trois valeurs peuvent être exportées à nouveau après un redémarrage du Codespace. Les secrets Codespaces doivent déjà apparaître dans l'environnement.

## 3. Vérifier sans afficher les secrets

Dans le dossier `backend`, exécute :

```bash
node --input-type=module -e "const keys=['DATABASE_URL','DIRECT_URL','SESSION_DATABASE_URL','SESSION_SECRET']; for (const k of keys) console.log(k + ': ' + (process.env[k] ? 'présent' : 'MANQUANT'))"
```

Cette commande affiche seulement si chaque variable est présente, jamais sa valeur. Si une variable est manquante, vérifie les secrets Codespaces et recrée le Codespace. Ne lance pas le serveur avant que les quatre variables secrètes et `FRONTEND_URL` soient présentes.

## 4. Installer et lancer

```bash
npm install
npm run db:generate
npm run check
npm run db:push
npm run dev
```

`npm run db:push` applique le schéma Prisma à la base configurée. Assure-toi qu'il s'agit du projet Supabase DevHub et qu'il ne contient pas de données à préserver avant de lancer cette commande.

Quand le serveur démarre, ouvre l'onglet **Ports**, ouvre le port `4000`, puis visite `/health`. Le résultat attendu est un statut OK avec la base connectée.

## Important

- Ne crée pas de fichier `.env` si tu utilises les Codespaces Secrets.
- Ne stocke jamais de secrets dans `devcontainer.json`, le code, les logs, les commits ou les captures d'écran.
- Les secrets Codespaces ne sont pas la même chose que les secrets GitHub Actions.
- GitHub Codespaces est l'environnement de développement ; pour un serveur disponible en continu, il faudra configurer les variables dans l'hébergeur de production.

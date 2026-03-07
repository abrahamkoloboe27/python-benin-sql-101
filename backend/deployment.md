# Déploiement du Backend sur Render

Ce guide explique comment déployer le backend Node.js/Express sur [Render](https://render.com) en utilisant Supabase (PostgreSQL) comme base de données.

---

## Prérequis

- Un compte [Render](https://render.com) (gratuit possible)
- Un projet [Supabase](https://supabase.com) avec la base de données déjà créée
- Le dépôt Git poussé sur GitHub

---

## Étape 1 — Récupérer l'URL de connexion Supabase

1. Connectez-vous à [supabase.com](https://supabase.com) et ouvrez votre projet
2. Dans le menu de gauche, cliquez sur **Settings** → **Database**
3. Faites défiler jusqu'à la section **Connection string**
4. Sélectionnez le mode **URI** et copiez l'URL (elle ressemble à) :
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
5. Notez cette URL, vous en aurez besoin à l'étape 3

---

## Étape 2 — Créer un service Web sur Render

1. Connectez-vous à [render.com](https://render.com)
2. Cliquez sur **New +** → **Web Service**
3. Connectez votre compte GitHub et sélectionnez le dépôt `python-benin-sql-101`
4. Configurez le service :
   - **Name** : `python-benin-sql-101-backend` (ou le nom de votre choix)
   - **Region** : choisissez la plus proche de vos utilisateurs
   - **Branch** : `main` (ou votre branche de production)
   - **Root Directory** : `backend`
   - **Runtime** : `Node`
   - **Build Command** : `npm ci --omit=dev`
   - **Start Command** : `node src/index.js`
5. Cliquez sur **Advanced** pour configurer les variables d'environnement

---

## Étape 3 — Configurer les variables d'environnement

Dans la section **Environment Variables**, ajoutez les variables suivantes :

| Clé | Valeur | Description |
|-----|--------|-------------|
| `NODE_ENV` | `production` | Mode de production |
| `PORT` | `10000` | Port d'écoute (Render utilise 10000 par défaut) |
| `JWT_SECRET` | `<une-longue-chaine-aleatoire>` | Secret JWT (utilisez au moins 32 caractères aléatoires) |
| `DATABASE_URL` | `postgresql://postgres:...` | URL de connexion Supabase copiée à l'étape 1 |

> **💡 Astuce pour JWT_SECRET** : Générez une valeur sécurisée avec :
> ```bash
> node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
> ```

---

## Étape 4 — Déployer

1. Cliquez sur **Create Web Service**
2. Render va automatiquement cloner le dépôt, installer les dépendances et démarrer le serveur
3. Attendez que le déploiement soit marqué **Live** (quelques minutes)
4. Vérifiez que l'API fonctionne en visitant :
   ```
   https://<votre-service>.onrender.com/api/health
   ```
   Vous devriez voir :
   ```json
   { "ok": true, "ts": "..." }
   ```

---

## Étape 5 — Copier l'URL du backend

Une fois le service déployé, copiez l'URL publique (ex : `https://python-benin-sql-101-backend.onrender.com`).  
Vous en aurez besoin pour configurer le frontend sur Vercel.

---

## Redéploiements automatiques

Render redéploie automatiquement le backend à chaque `git push` sur la branche configurée.

---

## Schéma de la base de données

Les tables `users` et `query_history` sont créées automatiquement au démarrage du serveur si elles n'existent pas encore dans Supabase. Aucune migration manuelle n'est nécessaire.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `DATABASE_URL est manquant` | Vérifiez que la variable `DATABASE_URL` est bien définie dans Render |
| `JWT_SECRET est manquant` | Vérifiez que la variable `JWT_SECRET` est bien définie dans Render |
| Erreur de connexion SSL | Assurez-vous que `NODE_ENV=production` est défini |
| Service qui s'endort (plan gratuit) | Sur le plan Free de Render, le service s'endort après 15 min d'inactivité. Le premier appel peut prendre ~30 s |

# Déploiement du Frontend sur Vercel

Ce guide explique comment déployer l'application React/Vite sur [Vercel](https://vercel.com).

---

## Prérequis

- Un compte [Vercel](https://vercel.com) (gratuit possible)
- Le backend déjà déployé sur Render (voir `backend/deployment.md`)
- Le dépôt Git poussé sur GitHub

---

## Étape 1 — Créer un nouveau projet sur Vercel

1. Connectez-vous à [vercel.com](https://vercel.com)
2. Cliquez sur **Add New…** → **Project**
3. Importez votre dépôt GitHub `python-benin-sql-101`
4. Vercel détecte automatiquement le framework Vite

---

## Étape 2 — Configurer le répertoire racine

Comme le frontend se trouve dans le sous-dossier `website/`, vous devez indiquer à Vercel où chercher :

1. Dans la section **Configure Project**, cherchez **Root Directory**
2. Cliquez sur **Edit** et entrez : `website`
3. Vercel mettra automatiquement à jour les commandes de build en conséquence

---

## Étape 3 — Vérifier les paramètres de build

Les paramètres suivants seront détectés automatiquement (ou à saisir manuellement) :

| Paramètre | Valeur |
|-----------|--------|
| **Framework Preset** | Vite |
| **Root Directory** | `website` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

## Étape 4 — Configurer les variables d'environnement

Dans la section **Environment Variables**, ajoutez :

| Clé | Valeur | Description |
|-----|--------|-------------|
| `VITE_API_URL` | `https://<votre-backend>.onrender.com` | URL complète du backend Render (sans slash final) |

> **Exemple** : `VITE_API_URL` = `https://python-benin-sql-101-backend.onrender.com`

---

## Étape 5 — Déployer

1. Cliquez sur **Deploy**
2. Vercel va construire et déployer l'application (environ 1-2 minutes)
3. Une fois le déploiement terminé, Vercel vous fournit une URL publique (ex : `https://python-benin-sql-101.vercel.app`)
4. Visitez cette URL pour vérifier que l'application fonctionne

---

## Redéploiements automatiques

Vercel redéploie automatiquement le frontend à chaque `git push` sur la branche configurée (par défaut `main`).

---

## Routage SPA

Le fichier `vercel.json` présent dans le dossier `website/` configure le routage SPA :
toutes les requêtes (ex : `/exercises`, `/schema`) sont redirigées vers `index.html` afin que React Router gère la navigation côté client.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Page blanche après déploiement | Vérifiez que le **Root Directory** est bien `website` dans les paramètres Vercel |
| Erreur 404 sur les routes (ex: `/exercises`) | Vérifiez que `vercel.json` est présent dans le dossier `website/` |
| Backend inaccessible (login ne fonctionne pas) | Vérifiez que `VITE_API_URL` pointe vers le bon backend Render et que le backend est démarré |
| La base SQLite de l'éditeur ne se charge pas | Vérifiez que le fichier `sql-wasm.wasm` est présent dans `website/public/` (nécessaire pour SQL.js, l'éditeur SQL in-browser) |
| Variables d'environnement non prises en compte | Les variables `VITE_*` sont injectées à la compilation — après les avoir modifiées, faites un nouveau déploiement (Redeploy) |

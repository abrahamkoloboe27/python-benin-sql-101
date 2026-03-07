# Backend – Python Bénin SQL 101

API REST Express pour la gestion des comptes utilisateurs et l'historique des requêtes SQL.

## Stack

- **Node.js** + **Express** – serveur HTTP
- **better-sqlite3** – base de données SQLite locale
- **bcryptjs** – hachage des mots de passe
- **jsonwebtoken** – sessions JWT
- **cors** – autorisations CORS pour le frontend

## Installation

```bash
cd backend
npm install
cp .env.example .env   # puis éditez les valeurs
npm run dev            # démarre avec node --watch (rechargement automatique)
```

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3001` | Port d'écoute |
| `JWT_SECRET` | – | **Obligatoire** – secret pour signer les JWT |
| `FRONTEND_URL` | `http://localhost:5173` | URL du frontend (CORS) |
| `DB_PATH` | `./data/users.db` | Chemin vers le fichier SQLite |

## Endpoints

### Authentification

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Créer un compte |
| `POST` | `/api/auth/login` | Public | Se connecter, reçoit un JWT |
| `GET` | `/api/auth/me` | 🔐 JWT | Infos de l'utilisateur connecté |

#### Corps de la requête – register / login

```json
{ "username": "jean_sql", "password": "motdepasse123" }
```

#### Réponse – register / login

```json
{
  "user": { "id": 1, "username": "jean_sql", "created_at": "2024-09-01 10:00:00" },
  "token": "<JWT>"
}
```

### Historique des requêtes

Toutes ces routes nécessitent le header `Authorization: Bearer <token>`.

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/history?limit=50` | Lister les requêtes (max 200) |
| `POST` | `/api/history` | Sauvegarder une requête |
| `DELETE` | `/api/history` | Effacer tout l'historique |
| `DELETE` | `/api/history/:id` | Supprimer une entrée |

#### Corps de la requête – POST /api/history

```json
{ "query": "SELECT * FROM eleves LIMIT 10;", "rows_returned": 10, "has_error": 0 }
```

### Santé

```
GET /api/health  →  { "ok": true, "ts": "..." }
```

## Déploiement en production

Le backend peut être hébergé sur :
- [Railway](https://railway.app)
- [Render](https://render.com) (free tier disponible)
- [Fly.io](https://fly.io)
- Tout VPS avec Node.js

Pensez à définir `JWT_SECRET` et `FRONTEND_URL` dans les variables d'environnement de la plateforme.

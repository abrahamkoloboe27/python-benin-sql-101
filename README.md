# 🐘 Python Bénin – SQL 101

> Séance d'introduction pratique à SQL — apprends en interrogeant une vraie base de données scolaire.

---

## 📋 Table des matières

1. [C'est quoi SQL ?](#-cest-quoi-sql-)
2. [Les différents dialectes SQL](#-les-différents-dialectes-sql)
3. [La base de données du lab](#-la-base-de-données-du-lab)
4. [Structure du dépôt](#-structure-du-dépôt)
5. [Setup (5 min)](#-setup-5-min)
6. [Par où commencer ?](#-par-où-commencer-)
7. [Ressources utiles](#-ressources-utiles)

---

## 🤔 C'est quoi SQL ?

**SQL** (Structured Query Language) est le langage standard pour interagir avec les bases de données relationnelles. Il permet de :

| Action | Mot-clé SQL | Exemple rapide |
|--------|-------------|----------------|
| Lire des données | `SELECT` | Afficher tous les élèves |
| Filtrer | `WHERE` | Seulement les élèves de 6ème |
| Trier | `ORDER BY` | Du meilleur au moins bon |
| Regrouper | `GROUP BY` | Moyenne par classe |
| Combiner des tables | `JOIN` | Notes + infos élève |
| Ajouter des données | `INSERT` | Ajouter un nouvel élève |
| Modifier des données | `UPDATE` | Corriger une note |
| Supprimer des données | `DELETE` | Retirer un élève |

SQL se découpe en plusieurs sous-langages :

- **DDL** (Data Definition Language) – créer/modifier la structure : `CREATE`, `ALTER`, `DROP`
- **DML** (Data Manipulation Language) – manipuler les données : `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- **DCL** (Data Control Language) – gérer les droits : `GRANT`, `REVOKE`
- **TCL** (Transaction Control Language) – gérer les transactions : `COMMIT`, `ROLLBACK`

> 💡 Dans cette séance, on se concentre sur **DML** — et surtout sur `SELECT`.

---

## 🌍 Les différents dialectes SQL

SQL est un standard (ISO), mais chaque moteur de base de données y ajoute ses propres extensions.

| Moteur | Utilisation typique | Points particuliers |
|--------|---------------------|---------------------|
| **PostgreSQL** | Open-source, production, data science | Très conforme au standard, types avancés (JSON, Array…) |
| **MySQL / MariaDB** | Web, LAMP stack | Très répandu, syntaxe légèrement différente |
| **SQLite** | Embarqué, prototypage, mobile | Fichier unique, pas de serveur |
| **SQL Server** | Écosystème Microsoft | T-SQL, intégration .NET |
| **Oracle** | Grandes entreprises | PL/SQL, très complet mais propriétaire |
| **BigQuery** | Data warehouse Google Cloud | SQL analytique à grande échelle |
| **DuckDB** | Analyse locale, data science | Super rapide, compatible Parquet/CSV |

> 🗄️ Dans ce dépôt, nous utilisons **PostgreSQL**.

---

## 🏫 La base de données du lab

Pour pratiquer, on utilise une base qui simule un **système scolaire** : des pays, des villes, des écoles, des élèves, des enseignants, des notes, des absences et des bulletins sur plusieurs années scolaires.

```
pays → villes → ecoles → classes ← annees_scolaires
                                 ↑
                              niveaux
                                 ↓
         enseignants → enseignements
                                 ↓
                    eleves → inscriptions
                                 ↓
              evaluations ← matieres
                    ↓
                  notes
                    ↓
     absences   bulletins
```

📚 La documentation complète de chaque table et de chaque champ se trouve dans [`docs/schema.md`](docs/schema.md).

---

## 📁 Structure du dépôt

```
python-benin-sql-101/
│
├── README.md                   ← Vous êtes ici
│
├── docs/
│   └── schema.md               ← Documentation des tables et champs
│
└── sql/
    ├── basics/                 ← Fiches de cours avec exemples (suivre dans l'ordre)
    │   ├── 01_select.sql       ← SELECT, colonnes, alias
    │   ├── 02_filtres.sql      ← WHERE, LIKE, IN, BETWEEN, IS NULL
    │   ├── 03_tri_limite.sql   ← ORDER BY, LIMIT, OFFSET
    │   ├── 04_agregats.sql     ← COUNT, SUM, AVG, MIN, MAX
    │   ├── 05_group_by.sql     ← GROUP BY, HAVING
    │   ├── 06_jointures.sql    ← INNER JOIN, LEFT JOIN
    │   └── 07_fonctions.sql    ← Fonctions chaînes, dates, maths, CASE WHEN
    │
    └── challenges/             ← Exercices à résoudre
        ├── README.md           ← Instructions et conseils
        ├── niveau_1.sql        ← 🟢 Débutant
        ├── niveau_2.sql        ← 🟡 Intermédiaire
        └── niveau_3.sql        ← 🔴 Avancé
```

---

## ⚡ Setup (5 min)

La base de données est fournie prête à l'emploi. Il suffit d'avoir **PostgreSQL** installé et un client SQL ([DBeaver](https://dbeaver.io/), [TablePlus](https://tableplus.com/) ou `psql`).

```bash
# 1. Installer les dépendances et configurer la connexion
cd generator && pip install -r requirements.txt
cp .env.example .env   # puis éditer .env avec vos identifiants PostgreSQL

# 2. Créer la base et charger les données (une seule fois)
python main.py --reset
```

> C'est tout. Vous pouvez maintenant brancher votre client SQL sur `school_db` et commencer à écrire des requêtes.

---

## 📖 Par où commencer ?

1. 📄 Parcourir [`docs/schema.md`](docs/schema.md) pour se repérer dans les tables
2. ▶️ Ouvrir [`sql/basics/01_select.sql`](sql/basics/01_select.sql) et exécuter les exemples un par un
3. 🔄 Progresser jusqu'à [`sql/basics/07_fonctions.sql`](sql/basics/07_fonctions.sql)
4. 🏋️ S'attaquer aux exercices dans [`sql/challenges/`](sql/challenges/)

---

## 📚 Ressources utiles

| Ressource | Lien |
|-----------|------|
| Documentation PostgreSQL (FR) | https://docs.postgresql.fr/ |
| SQLZoo (exercices interactifs) | https://sqlzoo.net/ |
| Mode Analytics SQL Tutorial | https://mode.com/sql-tutorial/ |
| W3Schools SQL | https://www.w3schools.com/sql/ |
| pgExercises | https://pgexercises.com/ |

---

> Made with ❤️ by [Python Bénin](https://www.pythonbenin.com) — *Learn. Build. Share.*

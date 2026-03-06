# 🏫 School DB Analysis

Projet de génération et d'analyse d'une base de données scolaire PostgreSQL.

## Objectif

Ce module crée une base de données PostgreSQL réaliste simulant le fonctionnement
d'un système éducatif multi-pays sur plusieurs années scolaires. Il génère des
données factices cohérentes à l'aide de **Faker**, **random** et **Pydantic**,
puis les insère directement en base via **psycopg2** / **SQLAlchemy**.

---

## Structure du projet

```
school-db-analysis/
├── schema.sql          # Définition complète du schéma PostgreSQL
├── models.py           # Modèles Pydantic (validation des données)
├── generate_data.py    # Logique de génération des données factices
├── main.py             # Point d'entrée (init DB + génération)
├── requirements.txt    # Dépendances Python
├── .env.example        # Template de configuration (credentials PostgreSQL)
└── README.md           # Ce fichier
```

---

## Schéma de la base de données

| Table              | Description                                                  |
|--------------------|--------------------------------------------------------------|
| `pays`             | Référentiel des pays (code ISO, continent)                   |
| `villes`           | Villes rattachées à un pays                                  |
| `ecoles`           | Établissements scolaires (type, niveau, directeur…)          |
| `annees_scolaires` | Années scolaires (ex : 2022-2023, dates début/fin)           |
| `niveaux`          | Niveaux scolaires (CP→Tle, ordre, cycle)                     |
| `classes`          | Classes par école, niveau et année scolaire                  |
| `matieres`         | Matières avec coefficient                                    |
| `enseignants`      | Corps enseignant rattaché à une école                        |
| `enseignements`    | Affectation enseignant ↔ classe × matière                    |
| `eleves`           | Élèves (données personnelles, contact parent)                |
| `inscriptions`     | Inscription élève → classe par année (suivi de progression)  |
| `evaluations`      | Évaluations (devoirs, compositions, examens) avec date_debut |
| `notes`            | Notes sur 20 par élève et évaluation                         |
| `absences`         | Absences (justifiées ou non)                                 |
| `bulletins`        | Bulletins trimestriels (moyenne, rang, appréciation)         |

### Vues SQL utiles

| Vue                    | Description                                              |
|------------------------|----------------------------------------------------------|
| `v_moyennes_eleves`    | Moyenne par élève, matière et année scolaire             |
| `v_classement_classe`  | Classement des élèves par classe et trimestre            |

---

## Installation

```bash
# 1. Cloner le repo et se placer dans ce dossier
cd projetcs/school-db-analysis

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Configurer la connexion PostgreSQL
cp .env.example .env
# Éditer .env avec vos propres credentials
```

---

## Utilisation

### Créer le schéma et générer les données (période par défaut : 2019–2024)

```bash
python main.py --reset
```

### Personnaliser la période de génération

```bash
python main.py --reset --date-debut 2020-09-01 --date-fin 2023-07-31
```

### Sans reset (ajout de données sans recréer le schéma)

```bash
python main.py
```

---

## Variables de configuration (generate_data.py)

| Variable                             | Défaut       | Description                                 |
|--------------------------------------|--------------|---------------------------------------------|
| `DATE_DEBUT`                         | 2019-09-01   | Première rentrée scolaire                   |
| `DATE_FIN`                           | 2024-07-31   | Fin de la dernière année scolaire           |
| `NB_PAYS`                            | 3            | Nombre de pays générés                      |
| `NB_VILLES_PAR_PAYS`                 | 4            | Villes par pays                             |
| `NB_ECOLES_PAR_VILLE`                | 2            | Écoles par ville                            |
| `NB_ELEVES_PAR_CLASSE`               | 30           | Effectif moyen par classe                   |
| `NB_EVALUATIONS_PAR_MATIERE_PAR_TRIM`| 2            | Évaluations par matière et trimestre        |
| `TAUX_REDOUBLEMENT`                  | 0.08 (8 %)   | Probabilité de redoublement                 |
| `TAUX_ABANDON`                       | 0.02 (2 %)   | Probabilité d'abandon scolaire par an       |

---

## Cohérence des données générées

- **Notes sur 20** : toutes les notes sont dans l'intervalle [0, 20].
- **Progression des élèves** : chaque élève est tracé via la table `inscriptions`.
  - Il passe au niveau supérieur l'année suivante (sauf redoublement).
  - Un faible pourcentage abandonne (non inscrit l'année suivante).
  - Le "talent" de chaque élève (centre gaussien de ses notes) est constant
    tout au long de sa scolarité pour garantir la cohérence des résultats.
- **Trimestres** : 3 trimestres par année scolaire, avec des dates réalistes.
- **Bulletins** : la moyenne générale est calculée en pondérant les notes
  par les coefficients des évaluations, sur 20.
- **Multi-années** : toutes les données couvrent la plage `DATE_DEBUT` → `DATE_FIN`.

---

## Exemple de requêtes d'analyse

```sql
-- Top 10 élèves par moyenne générale sur toute la scolarité
SELECT eleve_nom, eleve_prenom,
       ROUND(AVG(moyenne_generale), 2) AS moyenne_globale
FROM v_classement_classe
GROUP BY eleve_id, eleve_nom, eleve_prenom
ORDER BY moyenne_globale DESC
LIMIT 10;

-- Taux de réussite (moyenne >= 10) par école et année
SELECT c.ecole_id, a.libelle AS annee,
       COUNT(*) FILTER (WHERE b.moyenne_generale >= 10) * 100.0 / COUNT(*) AS taux_reussite
FROM bulletins b
JOIN classes c ON c.id = b.classe_id
JOIN annees_scolaires a ON a.id = b.annee_scolaire_id
WHERE b.trimestre = 3
GROUP BY c.ecole_id, a.libelle
ORDER BY a.libelle, c.ecole_id;

-- Évolution de la moyenne en Mathématiques par niveau
SELECT niveau_ordre_approx, annee_scolaire, ROUND(AVG(moyenne_matiere), 2)
FROM v_moyennes_eleves
WHERE matiere = 'Mathématiques'
GROUP BY 1, 2
ORDER BY 2, 1;
```

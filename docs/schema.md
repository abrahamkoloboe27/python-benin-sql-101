# 📐 Documentation du schéma de la base de données

> Base de données : **school_db** — Système scolaire multi-pays, multi-années

Cette page décrit toutes les tables, leurs champs, types et significations.

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [pays](#1--pays)
3. [villes](#2--villes)
4. [ecoles](#3--ecoles)
5. [annees_scolaires](#4--annees_scolaires)
6. [niveaux](#5--niveaux)
7. [matieres](#6--matieres)
8. [enseignants](#7--enseignants)
9. [classes](#8--classes)
10. [enseignements](#9--enseignements)
11. [eleves](#10--eleves)
12. [inscriptions](#11--inscriptions)
13. [evaluations](#12--evaluations)
14. [notes](#13--notes)
15. [absences](#14--absences)
16. [bulletins](#15--bulletins)
17. [Vues SQL](#vues-sql)
18. [Diagramme des relations](#diagramme-des-relations)

---

## Vue d'ensemble

| # | Table | Rôle | Lignes (approx.) |
|---|-------|------|-----------------|
| 1 | `pays` | Référentiel géographique – pays | 3 |
| 2 | `villes` | Villes par pays | 12 |
| 3 | `ecoles` | Établissements scolaires | 24 |
| 4 | `annees_scolaires` | Années scolaires (ex : 2022-2023) | 6 |
| 5 | `niveaux` | Niveaux scolaires (CP → Terminale) | 12 |
| 6 | `matieres` | Matières enseignées | 12 |
| 7 | `enseignants` | Corps enseignant | ~280 |
| 8 | `classes` | Classes par école, niveau et année | ~1 300 |
| 9 | `enseignements` | Affectation enseignant ↔ classe × matière | ~9 500 |
| 10 | `eleves` | Élèves inscrits dans le système | ~5 500 |
| 11 | `inscriptions` | Parcours scolaire (élève → classe × année) | ~26 000 |
| 12 | `evaluations` | Devoirs, compositions, examens | ~50 000 |
| 13 | `notes` | Notes sur 20 par élève et évaluation | ~1 200 000 |
| 14 | `absences` | Absences (justifiées ou non) | ~16 000 |
| 15 | `bulletins` | Bulletins trimestriels | ~80 000 |

---

## 1 · `pays`

Référentiel des pays du monde (simplifié à 3 pays dans notre jeu de données).

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` (entier auto) | ✗ | Clé primaire |
| `nom` | `VARCHAR(100)` | ✗ | Nom complet du pays (ex : `Bénin`) |
| `code_iso` | `CHAR(2)` | ✗ | Code ISO 3166-1 alpha-2 (ex : `BJ`, `FR`, `SN`) — unique |
| `continent` | `VARCHAR(50)` | ✗ | Continent (ex : `Afrique`, `Europe`) |
| `created_at` | `TIMESTAMP` | ✓ | Date/heure de création de l'enregistrement |

**Contraintes :** `nom` unique, `code_iso` unique.

**Exemple de données :**

| id | nom | code_iso | continent |
|----|-----|----------|-----------|
| 1 | Bénin | BJ | Afrique |
| 2 | France | FR | Europe |
| 3 | Sénégal | SN | Afrique |

---

## 2 · `villes`

Villes rattachées à un pays. Plusieurs villes peuvent appartenir au même pays.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `nom` | `VARCHAR(100)` | ✗ | Nom de la ville (ex : `Cotonou`) |
| `pays_id` | `INT` → `pays.id` | ✗ | Clé étrangère vers `pays` |
| `code_postal` | `VARCHAR(20)` | ✓ | Code postal (optionnel) |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Contraintes :** la paire `(nom, pays_id)` est unique (une même ville ne peut être listée deux fois dans un pays).

---

## 3 · `ecoles`

Établissements scolaires. Chaque école est localisée dans une ville et couvre un ou plusieurs niveaux.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `nom` | `VARCHAR(150)` | ✗ | Nom de l'établissement |
| `adresse` | `VARCHAR(255)` | ✓ | Adresse physique |
| `ville_id` | `INT` → `villes.id` | ✗ | Ville où se trouve l'école |
| `type_ecole` | `VARCHAR(20)` | ✗ | `public`, `prive` ou `communautaire` |
| `niveau_ecole` | `VARCHAR(20)` | ✗ | `primaire`, `college`, `lycee` ou `mixte` |
| `telephone` | `VARCHAR(20)` | ✓ | Numéro de téléphone |
| `email` | `VARCHAR(150)` | ✓ | Adresse e-mail |
| `directeur` | `VARCHAR(150)` | ✓ | Nom du directeur / proviseur |
| `date_creation` | `DATE` | ✓ | Date de création de l'établissement |
| `capacite_max` | `INT` | ✓ | Capacité maximale d'accueil (élèves) |
| `created_at` | `TIMESTAMP` | ✓ | Date de création de l'enregistrement |

**Valeurs autorisées :**
- `type_ecole` : `public` | `prive` | `communautaire`
- `niveau_ecole` : `primaire` | `college` | `lycee` | `mixte`

---

## 4 · `annees_scolaires`

Années scolaires couvrant la période 2019-2020 → 2024-2025.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `libelle` | `VARCHAR(20)` | ✗ | Label lisible (ex : `2022-2023`) — unique |
| `date_debut` | `DATE` | ✗ | Date de début de l'année (ex : `2022-09-01`) |
| `date_fin` | `DATE` | ✗ | Date de fin de l'année (ex : `2023-07-15`) |
| `est_active` | `BOOLEAN` | ✗ | `TRUE` si c'est l'année scolaire en cours |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Contrainte :** `date_fin > date_debut`.

---

## 5 · `niveaux`

Niveaux scolaires, du CP (primaire) jusqu'en Terminale (lycée).

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `nom` | `VARCHAR(50)` | ✗ | Nom court (ex : `6ème`, `CM2`, `Tle`) — unique |
| `ordre` | `INT` | ✗ | Rang dans le cursus scolaire (1 = premier niveau) — unique |
| `cycle` | `VARCHAR(20)` | ✗ | Cycle : `primaire`, `college` ou `lycee` |
| `description` | `VARCHAR(255)` | ✓ | Description longue (ex : `Cours Préparatoire`) |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Niveaux disponibles :**

| ordre | nom | cycle | description |
|-------|-----|-------|-------------|
| 1 | CP | primaire | Cours Préparatoire |
| 2 | CE1 | primaire | Cours Élémentaire 1 |
| 3 | CE2 | primaire | Cours Élémentaire 2 |
| 4 | CM1 | primaire | Cours Moyen 1 |
| 5 | CM2 | primaire | Cours Moyen 2 |
| 6 | 6ème | college | Sixième |
| 7 | 5ème | college | Cinquième |
| 8 | 4ème | college | Quatrième |
| 9 | 3ème | college | Troisième |
| 10 | 2nde | lycee | Seconde |
| 11 | 1ère | lycee | Première |
| 12 | Tle | lycee | Terminale |

---

## 6 · `matieres`

Matières enseignées dans les différents cycles scolaires.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `nom` | `VARCHAR(100)` | ✗ | Nom de la matière (ex : `Mathématiques`) — unique |
| `code` | `VARCHAR(10)` | ✗ | Code court en majuscules (ex : `MATH`, `FR`) — unique |
| `coefficient` | `NUMERIC(4,2)` | ✗ | Coefficient dans le calcul de la moyenne (défaut : `1.0`) |
| `cycle` | `VARCHAR(20)` | ✓ | Cycle concerné : `primaire`, `college`, `lycee` ou `tous` |
| `description` | `TEXT` | ✓ | Description libre |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

---

## 7 · `enseignants`

Corps enseignant rattaché à un établissement.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `nom` | `VARCHAR(100)` | ✗ | Nom de famille |
| `prenom` | `VARCHAR(100)` | ✗ | Prénom |
| `email` | `VARCHAR(150)` | ✓ | Adresse e-mail — unique |
| `telephone` | `VARCHAR(20)` | ✓ | Numéro de téléphone |
| `genre` | `CHAR(1)` | ✓ | `M` (masculin) ou `F` (féminin) |
| `date_naissance` | `DATE` | ✓ | Date de naissance |
| `date_embauche` | `DATE` | ✓ | Date d'embauche dans l'établissement |
| `specialite` | `VARCHAR(100)` | ✓ | Matière principale enseignée |
| `ecole_id` | `INT` → `ecoles.id` | ✓ | École de rattachement (peut être NULL si détaché) |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

---

## 8 · `classes`

Classes formées pour une école, un niveau et une année scolaire donnés.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `nom` | `VARCHAR(50)` | ✗ | Intitulé de la classe (ex : `6ème A`, `CM2 B`) |
| `ecole_id` | `INT` → `ecoles.id` | ✗ | École à laquelle appartient la classe |
| `niveau_id` | `INT` → `niveaux.id` | ✗ | Niveau scolaire de la classe |
| `annee_scolaire_id` | `INT` → `annees_scolaires.id` | ✗ | Année scolaire |
| `effectif_max` | `INT` | ✗ | Effectif maximum autorisé (défaut : 40) |
| `salle` | `VARCHAR(20)` | ✓ | Numéro ou nom de la salle (ex : `S01`) |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Contrainte :** la triplet `(nom, ecole_id, annee_scolaire_id)` est unique.

> 💡 La colonne `niveau_id` référence `niveaux`, mais le générateur utilise aussi `niveau_ordre` (l'attribut `ordre` du niveau) pour naviguer dans le parcours de l'élève.

---

## 9 · `enseignements`

Table de liaison : affecte un enseignant à une classe pour une matière donnée.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `enseignant_id` | `INT` → `enseignants.id` | ✗ | Enseignant concerné |
| `classe_id` | `INT` → `classes.id` | ✗ | Classe concernée |
| `matiere_id` | `INT` → `matieres.id` | ✗ | Matière enseignée |
| `heures_hebdo` | `NUMERIC(4,1)` | ✓ | Nombre d'heures hebdomadaires (défaut : 2.0) |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Contrainte :** la triplet `(enseignant_id, classe_id, matiere_id)` est unique.

---

## 10 · `eleves`

Élèves inscrits dans le système, avec leurs informations personnelles et celles de leur parent.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `nom` | `VARCHAR(100)` | ✗ | Nom de famille |
| `prenom` | `VARCHAR(100)` | ✗ | Prénom |
| `date_naissance` | `DATE` | ✗ | Date de naissance |
| `genre` | `CHAR(1)` | ✗ | `M` (masculin) ou `F` (féminin) |
| `adresse` | `VARCHAR(255)` | ✓ | Adresse du domicile |
| `ville_id` | `INT` → `villes.id` | ✓ | Ville de résidence |
| `email_parent` | `VARCHAR(150)` | ✓ | Email du parent / tuteur |
| `telephone_parent` | `VARCHAR(20)` | ✓ | Téléphone du parent / tuteur |
| `nom_parent` | `VARCHAR(200)` | ✓ | Nom complet du parent / tuteur |
| `date_inscription` | `DATE` | ✗ | Date de première inscription dans le système |
| `nationalite` | `VARCHAR(50)` | ✓ | Nationalité de l'élève |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

---

## 11 · `inscriptions`

Trace le parcours scolaire d'un élève : chaque ligne correspond à l'inscription d'un élève dans une classe pour une année scolaire. Un élève ne peut être inscrit que dans **une seule classe par année**.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `eleve_id` | `INT` → `eleves.id` | ✗ | Élève concerné |
| `classe_id` | `INT` → `classes.id` | ✗ | Classe dans laquelle l'élève est inscrit |
| `annee_scolaire_id` | `INT` → `annees_scolaires.id` | ✗ | Année scolaire |
| `date_inscription` | `DATE` | ✗ | Date effective d'inscription |
| `statut` | `VARCHAR(20)` | ✗ | Statut de l'élève cette année (voir ci-dessous) |
| `motif_sortie` | `VARCHAR(255)` | ✓ | Raison de sortie si statut ≠ `actif` |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Valeurs du champ `statut` :**

| Valeur | Signification |
|--------|--------------|
| `actif` | Élève régulièrement inscrit |
| `redoublant` | Élève qui redouble la même classe |
| `transfere` | Élève transféré dans un autre établissement |
| `abandonne` | Élève ayant abandonné la scolarité |
| `diplome` | Élève ayant obtenu son diplôme |

---

## 12 · `evaluations`

Évaluations organisées dans une classe, pour une matière et un trimestre donnés.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `titre` | `VARCHAR(200)` | ✗ | Intitulé de l'évaluation (ex : `Maths – Composition T1 n°1`) |
| `matiere_id` | `INT` → `matieres.id` | ✗ | Matière évaluée |
| `classe_id` | `INT` → `classes.id` | ✗ | Classe concernée |
| `annee_scolaire_id` | `INT` → `annees_scolaires.id` | ✗ | Année scolaire |
| `type_evaluation` | `VARCHAR(20)` | ✗ | Type d'évaluation (voir ci-dessous) |
| `trimestre` | `SMALLINT` | ✗ | Trimestre : `1`, `2` ou `3` |
| `date_debut` | `DATE` | ✗ | Date de début de l'épreuve |
| `date_fin` | `DATE` | ✓ | Date de fin (pour les compositions sur plusieurs jours) |
| `note_max` | `NUMERIC(5,2)` | ✗ | Barème maximum (défaut : `20.0`) |
| `coefficient` | `NUMERIC(4,2)` | ✗ | Coefficient de l'évaluation (défaut : `1.0`) |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Types d'évaluation :**

| Valeur | Signification |
|--------|--------------|
| `devoir` | Devoir à la maison ou en classe |
| `composition` | Composition de fin de trimestre (peut durer 1-3 jours) |
| `examen` | Examen de passage |
| `interrogation` | Interrogation surprise |

---

## 13 · `notes`

Note obtenue par un élève à une évaluation. Un élève ne peut avoir qu'**une seule note par évaluation**.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `evaluation_id` | `INT` → `evaluations.id` | ✗ | Évaluation concernée |
| `eleve_id` | `INT` → `eleves.id` | ✗ | Élève concerné |
| `note` | `NUMERIC(5,2)` | ✗ | Note obtenue (entre 0 et `note_max`) |
| `observation` | `TEXT` | ✓ | Commentaire du professeur sur la copie |
| `date_saisie` | `DATE` | ✗ | Date à laquelle la note a été saisie |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Contrainte :** la paire `(evaluation_id, eleve_id)` est unique.

> 💡 Le champ `observation` contient des commentaires tels que *"Bon travail."*, *"Peut mieux faire."*, etc. Environ 60 % des notes ont une observation non nulle.

---

## 14 · `absences`

Absences des élèves, justifiées ou non.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `eleve_id` | `INT` → `eleves.id` | ✗ | Élève absent |
| `classe_id` | `INT` → `classes.id` | ✗ | Classe de l'élève au moment de l'absence |
| `date_debut` | `DATE` | ✗ | Premier jour d'absence |
| `date_fin` | `DATE` | ✗ | Dernier jour d'absence |
| `motif` | `VARCHAR(255)` | ✓ | Motif déclaré (ex : `Maladie`, `Voyage`) — peut être NULL |
| `justifiee` | `BOOLEAN` | ✗ | `TRUE` si l'absence est justifiée (défaut : `FALSE`) |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Contrainte :** `date_fin >= date_debut`.

---

## 15 · `bulletins`

Bulletin scolaire trimestriel d'un élève. Synthèse de ses résultats pour un trimestre donné.

| Champ | Type SQL | Nullable | Description |
|-------|----------|----------|-------------|
| `id` | `SERIAL` | ✗ | Clé primaire |
| `eleve_id` | `INT` → `eleves.id` | ✗ | Élève concerné |
| `classe_id` | `INT` → `classes.id` | ✗ | Classe de l'élève ce trimestre |
| `annee_scolaire_id` | `INT` → `annees_scolaires.id` | ✗ | Année scolaire |
| `trimestre` | `SMALLINT` | ✗ | Trimestre : `1`, `2` ou `3` |
| `moyenne_generale` | `NUMERIC(5,2)` | ✓ | Moyenne pondérée sur 20 (peut être NULL si pas encore calculée) |
| `rang` | `INT` | ✓ | Rang de l'élève dans sa classe ce trimestre |
| `appreciation` | `TEXT` | ✓ | Appréciation du conseil de classe (ex : `Très bien`, `Passable`) |
| `date_emission` | `DATE` | ✓ | Date d'émission du bulletin |
| `created_at` | `TIMESTAMP` | ✓ | Date de création |

**Contrainte :** la triplet `(eleve_id, annee_scolaire_id, trimestre)` est unique.

**Appréciations générées :**

| Fourchette de moyenne | Appréciation |
|----------------------|-------------|
| ≥ 16 / 20 | Très bien |
| ≥ 14 / 20 | Bien |
| ≥ 12 / 20 | Assez bien |
| ≥ 10 / 20 | Passable |
| < 10 / 20 | Insuffisant |

---

## Vues SQL

### `v_moyennes_eleves`

Calcule la **moyenne de chaque élève par matière et année scolaire**, pondérée par les coefficients des évaluations.

| Colonne | Description |
|---------|-------------|
| `eleve_id` | Identifiant de l'élève |
| `eleve_nom` | Nom de l'élève |
| `eleve_prenom` | Prénom de l'élève |
| `matiere` | Nom de la matière |
| `coefficient_matiere` | Coefficient de la matière |
| `annee_scolaire` | Libellé de l'année (ex : `2022-2023`) |
| `classe_id` | Identifiant de la classe |
| `classe_nom` | Nom de la classe (ex : `6ème A`) |
| `moyenne_matiere` | Moyenne pondérée sur 20 |

### `v_classement_classe`

Affiche le **classement des élèves par classe et trimestre**, avec rang et appréciation.

| Colonne | Description |
|---------|-------------|
| `classe_id` | Identifiant de la classe |
| `classe_nom` | Nom de la classe |
| `annee_scolaire` | Libellé de l'année scolaire |
| `trimestre` | Trimestre (1, 2 ou 3) |
| `eleve_id` | Identifiant de l'élève |
| `eleve_nom` | Nom |
| `eleve_prenom` | Prénom |
| `moyenne_generale` | Moyenne générale sur 20 |
| `rang` | Rang dans la classe |
| `appreciation` | Appréciation du conseil de classe |

---

## Diagramme des relations

```
pays (1) ──────────── (N) villes (1) ──────── (N) ecoles
                                                    │
                              ┌────────────────────┤
                              │                    │
                           classes ◄── annees_scolaires
                              │   ◄── niveaux
                              │
              ┌───────────────┼──────────────┐
              │               │              │
          enseignements   inscriptions   evaluations ◄── matieres
          (enseignant ×   (eleve × an)       │
           classe × mat)                   notes ──► eleves
                                             │
                                         absences
                                         bulletins
```

**Légende des cardinalités :**
- `(1) ──── (N)` : une ligne d'un côté correspond à plusieurs de l'autre
- `◄──` : référence une clé étrangère

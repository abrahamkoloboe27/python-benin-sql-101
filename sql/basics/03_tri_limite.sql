-- =============================================================================
-- SQL 101 – Fiche 03 : Trier et limiter les résultats
-- =============================================================================
-- Objectifs :
--   • Trier les résultats avec ORDER BY (ASC / DESC)
--   • Trier sur plusieurs colonnes
--   • Limiter le nombre de lignes avec LIMIT
--   • Paginer les résultats avec OFFSET
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Trier par ordre croissant (ASC, valeur par défaut)
-- -----------------------------------------------------------------------------
-- Élèves par ordre alphabétique de nom
SELECT nom, prenom, date_naissance
FROM eleves
ORDER BY nom ASC
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 2. Trier par ordre décroissant (DESC)
-- -----------------------------------------------------------------------------
-- Meilleures notes en premier
SELECT eleve_id, note, date_saisie
FROM notes
ORDER BY note DESC
LIMIT 10;

-- Années scolaires les plus récentes en premier
SELECT libelle, date_debut, date_fin
FROM annees_scolaires
ORDER BY date_debut DESC;


-- -----------------------------------------------------------------------------
-- 3. Trier sur plusieurs colonnes
--    On peut combiner plusieurs critères : si deux lignes sont égales
--    sur le 1er critère, le 2ème critère les départage.
-- -----------------------------------------------------------------------------
-- Élèves triés par nationalité puis par nom
SELECT nom, prenom, nationalite
FROM eleves
ORDER BY nationalite ASC, nom ASC
LIMIT 15;

-- Classes triées par année scolaire (plus récente d'abord) puis par nom
SELECT c.nom AS classe, a.libelle AS annee
FROM classes c
JOIN annees_scolaires a ON a.id = c.annee_scolaire_id
ORDER BY a.date_debut DESC, c.nom ASC
LIMIT 15;


-- -----------------------------------------------------------------------------
-- 4. Limiter le nombre de résultats (LIMIT)
--    Très utile pour explorer sans se noyer dans les données.
-- -----------------------------------------------------------------------------
-- Les 5 premières écoles créées
SELECT nom, type_ecole, niveau_ecole
FROM ecoles
LIMIT 5;

-- Un élève au hasard (PostgreSQL)
SELECT nom, prenom, genre
FROM eleves
ORDER BY RANDOM()
LIMIT 1;


-- -----------------------------------------------------------------------------
-- 5. Paginer les résultats (LIMIT + OFFSET)
--    OFFSET = nombre de lignes à sauter avant de commencer.
--    Page 1 : OFFSET 0,  page 2 : OFFSET 10,  page 3 : OFFSET 20…
-- -----------------------------------------------------------------------------
-- Page 1 (élèves 1 à 10)
SELECT nom, prenom
FROM eleves
ORDER BY id
LIMIT 10 OFFSET 0;

-- Page 2 (élèves 11 à 20)
SELECT nom, prenom
FROM eleves
ORDER BY id
LIMIT 10 OFFSET 10;

-- Page 3 (élèves 21 à 30)
SELECT nom, prenom
FROM eleves
ORDER BY id
LIMIT 10 OFFSET 20;


-- -----------------------------------------------------------------------------
-- 6. TOP-N : les meilleures et les moins bonnes notes
-- -----------------------------------------------------------------------------
-- Top 5 des meilleures notes
SELECT eleve_id, note
FROM notes
ORDER BY note DESC
LIMIT 5;

-- Les 5 notes les plus basses
SELECT eleve_id, note
FROM notes
ORDER BY note ASC
LIMIT 5;


-- -----------------------------------------------------------------------------
-- 7. Trier avec des valeurs NULL
--    Par défaut PostgreSQL place les NULL en dernier (ASC) ou en premier (DESC).
--    On peut contrôler ça avec NULLS FIRST / NULLS LAST.
-- -----------------------------------------------------------------------------
-- Absences triées par motif (NULL en dernier)
SELECT eleve_id, motif, date_debut
FROM absences
ORDER BY motif ASC NULLS LAST
LIMIT 10;

-- Notes avec observation en premier
SELECT eleve_id, note, observation
FROM notes
ORDER BY observation ASC NULLS LAST
LIMIT 10;

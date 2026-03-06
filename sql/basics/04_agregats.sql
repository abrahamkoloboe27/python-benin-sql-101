-- =============================================================================
-- SQL 101 – Fiche 04 : Fonctions d'agrégation
-- =============================================================================
-- Objectifs :
--   • Compter des lignes avec COUNT
--   • Calculer une somme avec SUM
--   • Calculer une moyenne avec AVG
--   • Trouver le minimum / maximum avec MIN / MAX
--   • Comprendre le comportement avec les valeurs NULL
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. COUNT – Compter des lignes
-- -----------------------------------------------------------------------------
-- Combien y a-t-il d'élèves dans la base ?
SELECT COUNT(*) AS nb_eleves
FROM eleves;

-- Combien y a-t-il de notes saisies ?
SELECT COUNT(*) AS nb_notes
FROM notes;

-- Combien de notes ont une observation renseignée ?
--   COUNT(colonne) ignore les NULL → compte seulement les non-null
SELECT
    COUNT(*)              AS total_notes,
    COUNT(observation)    AS notes_avec_observation,
    COUNT(*) - COUNT(observation) AS notes_sans_observation
FROM notes;

-- Compter les valeurs distinctes
-- Combien de nationalités différentes parmi les élèves ?
SELECT COUNT(DISTINCT nationalite) AS nb_nationalites
FROM eleves;


-- -----------------------------------------------------------------------------
-- 2. SUM – Calculer une somme
-- -----------------------------------------------------------------------------
-- Total des heures hebdomadaires enseignées dans tout le système
SELECT SUM(heures_hebdo) AS total_heures_hebdo
FROM enseignements;

-- Nombre total de jours d'absence
SELECT SUM(date_fin - date_debut + 1) AS total_jours_absence
FROM absences;


-- -----------------------------------------------------------------------------
-- 3. AVG – Calculer une moyenne
-- -----------------------------------------------------------------------------
-- Moyenne générale de toutes les notes
SELECT ROUND(AVG(note), 2) AS moyenne_generale
FROM notes;

-- Moyenne des moyennes générales dans les bulletins
SELECT ROUND(AVG(moyenne_generale), 2) AS moyenne_bulletins
FROM bulletins
WHERE moyenne_generale IS NOT NULL;

-- Coefficient moyen des matières
SELECT ROUND(AVG(coefficient), 2) AS coef_moyen
FROM matieres;


-- -----------------------------------------------------------------------------
-- 4. MIN et MAX – Trouver les extremes
-- -----------------------------------------------------------------------------
-- Note la plus basse et la plus haute
SELECT
    MIN(note) AS note_min,
    MAX(note) AS note_max
FROM notes;

-- Première et dernière date d'inscription d'un élève
SELECT
    MIN(date_inscription) AS premiere_inscription,
    MAX(date_inscription) AS derniere_inscription
FROM eleves;

-- Plage des moyennes générales des bulletins
SELECT
    MIN(moyenne_generale) AS moy_min,
    MAX(moyenne_generale) AS moy_max,
    ROUND(AVG(moyenne_generale), 2) AS moy_moyenne
FROM bulletins;


-- -----------------------------------------------------------------------------
-- 5. Combiner plusieurs agrégats en une seule requête
-- -----------------------------------------------------------------------------
-- Statistiques complètes sur les notes
SELECT
    COUNT(*)                        AS nb_notes,
    ROUND(MIN(note), 2)             AS note_min,
    ROUND(MAX(note), 2)             AS note_max,
    ROUND(AVG(note), 2)             AS note_moyenne,
    COUNT(*) FILTER (WHERE note >= 10) AS notes_reussite,
    ROUND(
        COUNT(*) FILTER (WHERE note >= 10) * 100.0 / COUNT(*),
        1
    )                               AS taux_reussite_pct
FROM notes;


-- -----------------------------------------------------------------------------
-- 6. FILTER – Agrégat conditionnel (PostgreSQL)
--    Equivalent de CASE WHEN à l'intérieur d'un agrégat.
-- -----------------------------------------------------------------------------
-- Répartition des absences justifiées vs non justifiées
SELECT
    COUNT(*)                                   AS total_absences,
    COUNT(*) FILTER (WHERE justifiee = TRUE)   AS justifiees,
    COUNT(*) FILTER (WHERE justifiee = FALSE)  AS non_justifiees
FROM absences;

-- Répartition des élèves par genre
SELECT
    COUNT(*)                               AS total_eleves,
    COUNT(*) FILTER (WHERE genre = 'M')    AS masculin,
    COUNT(*) FILTER (WHERE genre = 'F')    AS feminin
FROM eleves;

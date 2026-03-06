-- =============================================================================
-- SQL 101 – Fiche 01 : SELECT, colonnes et alias
-- =============================================================================
-- Objectifs :
--   • Récupérer des données d'une table
--   • Sélectionner des colonnes précises
--   • Donner un alias à une colonne ou une table
--   • Éviter les doublons avec DISTINCT
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Sélectionner TOUTES les colonnes d'une table
--    L'étoile (*) retourne tout — pratique pour explorer, mais à éviter
--    en production (coût réseau, lisibilité).
-- -----------------------------------------------------------------------------
SELECT *
FROM pays;


-- -----------------------------------------------------------------------------
-- 2. Sélectionner des colonnes précises
--    On précise uniquement ce dont on a besoin.
-- -----------------------------------------------------------------------------
SELECT nom, code_iso, continent
FROM pays;


-- -----------------------------------------------------------------------------
-- 3. Donner un alias à une colonne (AS)
--    Utile pour renommer une colonne dans le résultat.
-- -----------------------------------------------------------------------------
SELECT
    nom        AS pays,
    code_iso   AS "Code ISO",
    continent
FROM pays;


-- -----------------------------------------------------------------------------
-- 4. Calculer une nouvelle colonne à la volée
--    On peut faire des opérations directement dans le SELECT.
-- -----------------------------------------------------------------------------
-- Durée de chaque année scolaire en jours
SELECT
    libelle                              AS annee,
    date_debut,
    date_fin,
    (date_fin - date_debut)              AS duree_jours
FROM annees_scolaires;


-- -----------------------------------------------------------------------------
-- 5. Concaténer des chaînes de caractères
--    Opérateur ||  ou fonction CONCAT()
-- -----------------------------------------------------------------------------
-- Nom complet des élèves
SELECT
    id,
    nom || ' ' || prenom   AS nom_complet,
    genre,
    date_naissance
FROM eleves
LIMIT 10;

-- Même résultat avec CONCAT
SELECT
    id,
    CONCAT(nom, ' ', prenom)  AS nom_complet
FROM eleves
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 6. Éviter les doublons avec DISTINCT
--    DISTINCT filtre les lignes identiques dans le résultat.
-- -----------------------------------------------------------------------------
-- Quels continents sont présents ?
SELECT DISTINCT continent
FROM pays;

-- Quelles nationalités ont nos élèves ?
SELECT DISTINCT nationalite
FROM eleves
ORDER BY nationalite;

-- Quels types d'écoles existent ?
SELECT DISTINCT type_ecole, niveau_ecole
FROM ecoles
ORDER BY type_ecole, niveau_ecole;


-- -----------------------------------------------------------------------------
-- 7. Utiliser un alias sur la table (raccourci pratique)
-- -----------------------------------------------------------------------------
SELECT
    e.nom,
    e.prenom,
    e.genre
FROM eleves e
LIMIT 5;


-- -----------------------------------------------------------------------------
-- 8. Sélectionner des valeurs littérales et des expressions
-- -----------------------------------------------------------------------------
SELECT
    'Bénin'         AS pays_exemple,
    2024            AS annee_exemple,
    10 * 2          AS calcul,
    CURRENT_DATE    AS aujourdhui;

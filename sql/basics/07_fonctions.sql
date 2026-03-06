-- =============================================================================
-- SQL 101 – Fiche 07 : Fonctions intégrées
-- =============================================================================
-- Objectifs :
--   • Fonctions sur les chaînes de caractères
--   • Fonctions sur les dates
--   • Fonctions mathématiques
--   • Fonction conditionnelle CASE WHEN
--   • Gestion des NULL avec COALESCE et NULLIF
-- =============================================================================


-- =============================================================================
-- A. FONCTIONS SUR LES CHAÎNES DE CARACTÈRES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- UPPER / LOWER – Convertir la casse
-- -----------------------------------------------------------------------------
SELECT
    UPPER(nom)   AS nom_majuscule,
    LOWER(prenom) AS prenom_minuscule
FROM eleves
LIMIT 5;

-- -----------------------------------------------------------------------------
-- LENGTH – Longueur d'une chaîne
-- -----------------------------------------------------------------------------
SELECT nom, LENGTH(nom) AS longueur_nom
FROM eleves
ORDER BY longueur_nom DESC
LIMIT 5;

-- -----------------------------------------------------------------------------
-- TRIM / LTRIM / RTRIM – Supprimer les espaces
-- -----------------------------------------------------------------------------
SELECT TRIM('  Cotonou  ') AS ville_nettoyee;

-- -----------------------------------------------------------------------------
-- SUBSTRING / LEFT / RIGHT – Extraire une sous-chaîne
-- -----------------------------------------------------------------------------
-- Les 3 premières lettres du nom
SELECT
    nom,
    LEFT(nom, 3)          AS debut,
    RIGHT(nom, 3)         AS fin,
    SUBSTRING(nom, 2, 4)  AS milieu   -- à partir du 2ème caractère, 4 chars
FROM eleves
LIMIT 5;

-- -----------------------------------------------------------------------------
-- REPLACE – Remplacer une sous-chaîne
-- -----------------------------------------------------------------------------
SELECT REPLACE('Cours Préparatoire', 'Cours', 'C.') AS abrev;

-- -----------------------------------------------------------------------------
-- CONCAT / || – Concaténer
-- -----------------------------------------------------------------------------
SELECT
    CONCAT(prenom, ' ', nom)       AS nom_complet_concat,
    prenom || ' ' || nom           AS nom_complet_pipe
FROM eleves
LIMIT 5;

-- -----------------------------------------------------------------------------
-- SPLIT_PART – Découper une chaîne sur un séparateur
-- -----------------------------------------------------------------------------
-- Extraire l'année d'un libellé "2022-2023"
SELECT
    libelle,
    SPLIT_PART(libelle, '-', 1)  AS annee_debut,
    SPLIT_PART(libelle, '-', 2)  AS annee_fin
FROM annees_scolaires;

-- -----------------------------------------------------------------------------
-- POSITION / STRPOS – Trouver la position d'une sous-chaîne
-- -----------------------------------------------------------------------------
SELECT
    nom,
    STRPOS(nom, 'a') AS position_a   -- position de la première lettre 'a'
FROM eleves
WHERE STRPOS(nom, 'a') > 0
LIMIT 5;


-- =============================================================================
-- B. FONCTIONS SUR LES DATES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CURRENT_DATE, NOW() – Date et heure actuelles
-- -----------------------------------------------------------------------------
SELECT
    CURRENT_DATE       AS aujourd_hui,
    NOW()              AS maintenant,
    CURRENT_TIMESTAMP  AS timestamp_actuel;

-- -----------------------------------------------------------------------------
-- EXTRACT – Extraire une partie d'une date
-- -----------------------------------------------------------------------------
SELECT
    date_naissance,
    EXTRACT(YEAR  FROM date_naissance)  AS annee,
    EXTRACT(MONTH FROM date_naissance)  AS mois,
    EXTRACT(DAY   FROM date_naissance)  AS jour
FROM eleves
LIMIT 5;

-- -----------------------------------------------------------------------------
-- DATE_PART – Equivalent d'EXTRACT (style fonction)
-- -----------------------------------------------------------------------------
SELECT
    libelle,
    DATE_PART('year', date_debut)  AS annee_debut
FROM annees_scolaires;

-- -----------------------------------------------------------------------------
-- AGE – Calculer un âge ou une durée
-- -----------------------------------------------------------------------------
-- Âge actuel des élèves
SELECT
    nom,
    prenom,
    date_naissance,
    AGE(date_naissance)                     AS age_exact,
    EXTRACT(YEAR FROM AGE(date_naissance))  AS age_ans
FROM eleves
ORDER BY age_ans ASC
LIMIT 5;

-- Durée de chaque année scolaire
SELECT
    libelle,
    AGE(date_fin, date_debut)  AS duree
FROM annees_scolaires;

-- -----------------------------------------------------------------------------
-- DATE_TRUNC – Tronquer une date à un niveau de précision
-- -----------------------------------------------------------------------------
-- Regrouper les dates de saisie des notes par mois
SELECT
    DATE_TRUNC('month', date_saisie)  AS mois,
    COUNT(*)                           AS nb_notes
FROM notes
GROUP BY mois
ORDER BY mois
LIMIT 12;

-- -----------------------------------------------------------------------------
-- Intervalles – Ajouter / soustraire des jours, mois, années
-- -----------------------------------------------------------------------------
SELECT
    libelle,
    date_debut,
    date_debut + INTERVAL '30 days'   AS un_mois_apres,
    date_debut + INTERVAL '1 year'    AS un_an_apres
FROM annees_scolaires
LIMIT 3;

-- -----------------------------------------------------------------------------
-- TO_CHAR – Formater une date en texte
-- -----------------------------------------------------------------------------
SELECT
    libelle,
    TO_CHAR(date_debut, 'DD/MM/YYYY') AS debut_formate,
    TO_CHAR(date_debut, 'Month YYYY') AS debut_long
FROM annees_scolaires;


-- =============================================================================
-- C. FONCTIONS MATHÉMATIQUES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ROUND – Arrondir
-- -----------------------------------------------------------------------------
SELECT
    note,
    ROUND(note, 0)  AS note_arrondie,
    ROUND(note, 1)  AS note_1_dec
FROM notes
LIMIT 5;

-- -----------------------------------------------------------------------------
-- CEIL / FLOOR – Arrondi supérieur / inférieur
-- -----------------------------------------------------------------------------
SELECT
    moyenne_generale,
    CEIL(moyenne_generale)   AS arrondi_sup,
    FLOOR(moyenne_generale)  AS arrondi_inf
FROM bulletins
WHERE moyenne_generale IS NOT NULL
LIMIT 5;

-- -----------------------------------------------------------------------------
-- ABS – Valeur absolue
-- -----------------------------------------------------------------------------
SELECT ABS(-5.7) AS valeur_absolue;

-- Écart à la moyenne de la classe (imaginaire)
SELECT
    eleve_id,
    note,
    ROUND(AVG(note) OVER (), 2)            AS moy_globale,
    ROUND(ABS(note - AVG(note) OVER ()), 2) AS ecart_absolu
FROM notes
LIMIT 10;

-- -----------------------------------------------------------------------------
-- POWER / SQRT – Puissance et racine carrée
-- -----------------------------------------------------------------------------
SELECT POWER(2, 10) AS deux_puissance_10, SQRT(144) AS racine_de_144;


-- =============================================================================
-- D. CASE WHEN – Expression conditionnelle
-- =============================================================================
-- Équivalent d'un if/elif/else dans SQL.

-- Transformer la note en mention
SELECT
    eleve_id,
    note,
    CASE
        WHEN note >= 16 THEN 'Très bien'
        WHEN note >= 14 THEN 'Bien'
        WHEN note >= 12 THEN 'Assez bien'
        WHEN note >= 10 THEN 'Passable'
        ELSE 'Insuffisant'
    END AS mention
FROM notes
LIMIT 10;

-- Catégoriser les absences par durée
SELECT
    eleve_id,
    date_debut,
    date_fin,
    (date_fin - date_debut + 1) AS nb_jours,
    CASE
        WHEN (date_fin - date_debut + 1) = 1 THEN 'Courte (1 jour)'
        WHEN (date_fin - date_debut + 1) <= 3 THEN 'Moyenne (2-3 jours)'
        ELSE 'Longue (4+ jours)'
    END AS categorie
FROM absences
LIMIT 10;


-- =============================================================================
-- E. COALESCE et NULLIF – Gérer les NULL
-- =============================================================================

-- COALESCE : retourne la première valeur non-NULL de la liste
-- Afficher le motif d'absence, ou "Non renseigné" si NULL
SELECT
    eleve_id,
    COALESCE(motif, 'Non renseigné') AS motif_affiche
FROM absences
LIMIT 10;

-- COALESCE : observation de la note ou message par défaut
SELECT
    eleve_id,
    note,
    COALESCE(observation, '(pas de commentaire)') AS commentaire
FROM notes
LIMIT 10;

-- NULLIF : retourne NULL si les deux arguments sont égaux
-- Éviter la division par zéro
SELECT
    10.0 / NULLIF(0, 0)   AS division_securisee,   -- retourne NULL
    10.0 / NULLIF(2, 0)   AS division_normale;      -- retourne 5.0

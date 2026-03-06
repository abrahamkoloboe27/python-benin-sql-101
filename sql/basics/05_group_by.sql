-- =============================================================================
-- SQL 101 – Fiche 05 : Regroupement avec GROUP BY et HAVING
-- =============================================================================
-- Objectifs :
--   • Regrouper des lignes avec GROUP BY
--   • Combiner GROUP BY et des fonctions d'agrégation
--   • Filtrer sur les groupes avec HAVING (≠ WHERE)
--   • Comprendre l'ordre d'exécution d'une requête SQL
-- =============================================================================
-- 💡 Ordre d'exécution SQL (logique, pas syntaxique) :
--   FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. GROUP BY – Regrouper les lignes
--    Chaque valeur distincte de la colonne forme un groupe.
-- -----------------------------------------------------------------------------
-- Nombre d'élèves par genre
SELECT
    genre,
    COUNT(*) AS nb_eleves
FROM eleves
GROUP BY genre;

-- Nombre d'élèves par nationalité
SELECT
    nationalite,
    COUNT(*) AS nb_eleves
FROM eleves
GROUP BY nationalite
ORDER BY nb_eleves DESC;

-- Nombre d'écoles par type
SELECT
    type_ecole,
    COUNT(*) AS nb_ecoles
FROM ecoles
GROUP BY type_ecole
ORDER BY nb_ecoles DESC;


-- -----------------------------------------------------------------------------
-- 2. GROUP BY + agrégats
-- -----------------------------------------------------------------------------
-- Moyenne des notes par type d'évaluation
SELECT
    ev.type_evaluation,
    COUNT(n.id)               AS nb_notes,
    ROUND(AVG(n.note), 2)     AS moyenne,
    ROUND(MIN(n.note), 2)     AS note_min,
    ROUND(MAX(n.note), 2)     AS note_max
FROM notes n
JOIN evaluations ev ON ev.id = n.evaluation_id
GROUP BY ev.type_evaluation
ORDER BY moyenne DESC;

-- Nombre d'absences et durée totale par justification
SELECT
    justifiee,
    COUNT(*)                              AS nb_absences,
    SUM(date_fin - date_debut + 1)        AS total_jours
FROM absences
GROUP BY justifiee;

-- Nombre de classes par niveau scolaire
SELECT
    niv.nom       AS niveau,
    niv.cycle,
    COUNT(c.id)   AS nb_classes
FROM classes c
JOIN niveaux niv ON niv.id = c.niveau_id
GROUP BY niv.id, niv.nom, niv.cycle
ORDER BY niv.ordre;


-- -----------------------------------------------------------------------------
-- 3. GROUP BY sur plusieurs colonnes
-- -----------------------------------------------------------------------------
-- Répartition des élèves par genre ET nationalité
SELECT
    genre,
    nationalite,
    COUNT(*) AS nb_eleves
FROM eleves
GROUP BY genre, nationalite
ORDER BY nationalite, genre;

-- Nombre de notes par trimestre et par type d'évaluation
SELECT
    ev.trimestre,
    ev.type_evaluation,
    COUNT(*)              AS nb_notes,
    ROUND(AVG(n.note), 2) AS moyenne
FROM notes n
JOIN evaluations ev ON ev.id = n.evaluation_id
GROUP BY ev.trimestre, ev.type_evaluation
ORDER BY ev.trimestre, ev.type_evaluation;


-- -----------------------------------------------------------------------------
-- 4. HAVING – Filtrer sur les groupes
--    WHERE filtre AVANT le regroupement (sur les lignes individuelles).
--    HAVING filtre APRÈS le regroupement (sur les résultats agrégés).
-- -----------------------------------------------------------------------------
-- Nationalités avec plus de 500 élèves
SELECT
    nationalite,
    COUNT(*) AS nb_eleves
FROM eleves
GROUP BY nationalite
HAVING COUNT(*) > 500
ORDER BY nb_eleves DESC;

-- Matières dont la note moyenne est inférieure à 10
SELECT
    m.nom         AS matiere,
    COUNT(n.id)   AS nb_notes,
    ROUND(AVG(n.note), 2) AS moyenne
FROM notes n
JOIN evaluations ev ON ev.id = n.evaluation_id
JOIN matieres m ON m.id = ev.matiere_id
GROUP BY m.id, m.nom
HAVING AVG(n.note) < 10
ORDER BY moyenne ASC;

-- Élèves avec plus de 3 absences
SELECT
    eleve_id,
    COUNT(*) AS nb_absences
FROM absences
GROUP BY eleve_id
HAVING COUNT(*) > 3
ORDER BY nb_absences DESC
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 5. WHERE + GROUP BY + HAVING ensemble
-- -----------------------------------------------------------------------------
-- Pour les compositions uniquement (WHERE),
-- afficher les matières dont la moyenne est > 12 (HAVING)
SELECT
    m.nom            AS matiere,
    COUNT(n.id)      AS nb_compositions,
    ROUND(AVG(n.note), 2) AS moyenne_compositions
FROM notes n
JOIN evaluations ev ON ev.id = n.evaluation_id
JOIN matieres m ON m.id = ev.matiere_id
WHERE ev.type_evaluation = 'composition'      -- filtre AVANT group
GROUP BY m.id, m.nom
HAVING AVG(n.note) > 12                       -- filtre APRÈS group
ORDER BY moyenne_compositions DESC;


-- -----------------------------------------------------------------------------
-- 6. Requête récapitulative : tableau de bord par année scolaire
-- -----------------------------------------------------------------------------
SELECT
    a.libelle                                AS annee_scolaire,
    COUNT(DISTINCT i.eleve_id)               AS nb_eleves,
    COUNT(DISTINCT c.id)                     AS nb_classes,
    COUNT(n.id)                              AS nb_notes,
    ROUND(AVG(n.note), 2)                    AS moyenne_notes,
    COUNT(DISTINCT ab.id)                    AS nb_absences
FROM annees_scolaires a
LEFT JOIN classes      c  ON c.annee_scolaire_id = a.id
LEFT JOIN inscriptions i  ON i.annee_scolaire_id = a.id
LEFT JOIN evaluations  ev ON ev.annee_scolaire_id = a.id
LEFT JOIN notes        n  ON n.evaluation_id = ev.id
LEFT JOIN absences     ab ON ab.classe_id = c.id
GROUP BY a.id, a.libelle
ORDER BY a.date_debut;

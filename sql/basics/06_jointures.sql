-- =============================================================================
-- SQL 101 – Fiche 06 : Jointures (JOIN)
-- =============================================================================
-- Objectifs :
--   • Comprendre le principe des jointures
--   • INNER JOIN – ne garder que les correspondances
--   • LEFT JOIN – garder toutes les lignes de gauche
--   • Enchaîner plusieurs jointures
--   • Utiliser des alias de table pour clarifier les requêtes
-- =============================================================================
-- 💡 Rappel : les tables sont reliées par des clés étrangères.
--   Par exemple : notes.evaluation_id → evaluations.id
--                 evaluations.classe_id → classes.id
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. INNER JOIN – Correspondances uniquement
--    Retourne les lignes pour lesquelles la condition de jointure
--    est vraie dans les DEUX tables. Les lignes sans correspondance
--    sont exclues.
-- -----------------------------------------------------------------------------
-- Afficher chaque note avec le nom de l'élève
SELECT
    e.nom            AS eleve_nom,
    e.prenom         AS eleve_prenom,
    n.note,
    n.date_saisie
FROM notes n
INNER JOIN eleves e ON e.id = n.eleve_id
LIMIT 10;

-- Afficher chaque note avec le titre de l'évaluation
SELECT
    ev.titre          AS evaluation,
    ev.type_evaluation,
    n.note
FROM notes n
INNER JOIN evaluations ev ON ev.id = n.evaluation_id
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 2. Enchaîner plusieurs JOIN
--    On peut joindre autant de tables que nécessaire.
-- -----------------------------------------------------------------------------
-- Note + nom élève + titre évaluation + matière
SELECT
    e.nom || ' ' || e.prenom   AS eleve,
    m.nom                      AS matiere,
    ev.type_evaluation,
    ev.trimestre,
    n.note,
    n.observation
FROM notes n
JOIN eleves      e   ON e.id  = n.eleve_id
JOIN evaluations ev  ON ev.id = n.evaluation_id
JOIN matieres    m   ON m.id  = ev.matiere_id
LIMIT 15;


-- -----------------------------------------------------------------------------
-- 3. JOIN avec filtre WHERE
-- -----------------------------------------------------------------------------
-- Notes de Mathématiques du trimestre 1
SELECT
    e.nom || ' ' || e.prenom   AS eleve,
    n.note,
    ev.trimestre
FROM notes n
JOIN eleves      e  ON e.id  = n.eleve_id
JOIN evaluations ev ON ev.id = n.evaluation_id
JOIN matieres    m  ON m.id  = ev.matiere_id
WHERE m.nom = 'Mathématiques'
  AND ev.trimestre = 1
ORDER BY n.note DESC
LIMIT 15;


-- -----------------------------------------------------------------------------
-- 4. LEFT JOIN – Garder toutes les lignes de gauche
--    Toutes les lignes de la table "gauche" sont conservées.
--    Si aucune correspondance n'existe dans la table "droite",
--    les colonnes de droite valent NULL.
-- -----------------------------------------------------------------------------
-- Tous les élèves, avec leur nombre d'absences (0 si aucune absence)
SELECT
    e.nom,
    e.prenom,
    COUNT(a.id) AS nb_absences
FROM eleves e
LEFT JOIN absences a ON a.eleve_id = e.id
GROUP BY e.id, e.nom, e.prenom
ORDER BY nb_absences DESC
LIMIT 15;

-- Toutes les écoles, avec le nombre d'enseignants rattachés
SELECT
    ec.nom           AS ecole,
    COUNT(en.id)     AS nb_enseignants
FROM ecoles ec
LEFT JOIN enseignants en ON en.ecole_id = ec.id
GROUP BY ec.id, ec.nom
ORDER BY nb_enseignants DESC;

-- Différence INNER vs LEFT JOIN :
--   INNER JOIN : seulement les élèves ayant AU MOINS UNE absence
SELECT COUNT(DISTINCT e.id) AS eleves_avec_absences
FROM eleves e
INNER JOIN absences a ON a.eleve_id = e.id;

--   LEFT JOIN  : TOUS les élèves (y compris ceux sans absence)
SELECT COUNT(DISTINCT e.id) AS tous_eleves
FROM eleves e
LEFT JOIN absences a ON a.eleve_id = e.id;


-- -----------------------------------------------------------------------------
-- 5. Trouver les lignes sans correspondance (anti-join)
--    Technique : LEFT JOIN + WHERE droite.id IS NULL
-- -----------------------------------------------------------------------------
-- Élèves qui n'ont aucune absence enregistrée
SELECT
    e.id,
    e.nom,
    e.prenom
FROM eleves e
LEFT JOIN absences a ON a.eleve_id = e.id
WHERE a.id IS NULL
LIMIT 10;

-- Évaluations sans aucune note saisie
SELECT
    ev.id,
    ev.titre,
    ev.date_debut
FROM evaluations ev
LEFT JOIN notes n ON n.evaluation_id = ev.id
WHERE n.id IS NULL
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 6. Requête complète multi-jointures : parcours d'un élève
-- -----------------------------------------------------------------------------
-- Toutes les inscriptions d'un élève, avec le nom de la classe et de l'école
SELECT
    e.nom || ' ' || e.prenom    AS eleve,
    a.libelle                   AS annee_scolaire,
    c.nom                       AS classe,
    ec.nom                      AS ecole,
    niv.nom                     AS niveau,
    i.statut
FROM inscriptions i
JOIN eleves          e   ON e.id   = i.eleve_id
JOIN classes         c   ON c.id   = i.classe_id
JOIN ecoles          ec  ON ec.id  = c.ecole_id
JOIN niveaux         niv ON niv.id = c.niveau_id
JOIN annees_scolaires a  ON a.id   = i.annee_scolaire_id
ORDER BY e.nom, a.date_debut
LIMIT 20;


-- -----------------------------------------------------------------------------
-- 7. Jointure sur une vue
--    Les vues se comportent comme des tables dans les requêtes.
-- -----------------------------------------------------------------------------
-- Top 10 des élèves en Mathématiques toutes années confondues
SELECT
    eleve_nom,
    eleve_prenom,
    annee_scolaire,
    ROUND(moyenne_matiere, 2) AS moy_maths
FROM v_moyennes_eleves
WHERE matiere = 'Mathématiques'
ORDER BY moy_maths DESC
LIMIT 10;

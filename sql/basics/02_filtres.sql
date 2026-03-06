-- =============================================================================
-- SQL 101 – Fiche 02 : Filtres avec WHERE
-- =============================================================================
-- Objectifs :
--   • Filtrer les lignes avec WHERE
--   • Utiliser les opérateurs de comparaison
--   • Combiner des conditions (AND, OR, NOT)
--   • Chercher des motifs avec LIKE / ILIKE
--   • Filtrer sur une liste de valeurs (IN)
--   • Filtrer sur un intervalle (BETWEEN)
--   • Tester les valeurs nulles (IS NULL / IS NOT NULL)
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Filtrer avec une condition simple (=, <>, >, <, >=, <=)
-- -----------------------------------------------------------------------------
-- Seulement les élèves de genre féminin
SELECT nom, prenom, genre
FROM eleves
WHERE genre = 'F'
LIMIT 10;

-- Écoles avec plus de 500 élèves de capacité
SELECT nom, capacite_max
FROM ecoles
WHERE capacite_max > 500;

-- Notes inférieures à 5
SELECT eleve_id, note, observation
FROM notes
WHERE note < 5
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 2. Combiner des conditions avec AND et OR
-- -----------------------------------------------------------------------------
-- Élèves masculins de nationalité béninoise
SELECT nom, prenom, genre, nationalite
FROM eleves
WHERE genre = 'M'
  AND nationalite = 'Béninoise'
LIMIT 10;

-- Absences justifiées OU d'une durée supérieure à 3 jours
SELECT eleve_id, date_debut, date_fin, motif, justifiee
FROM absences
WHERE justifiee = TRUE
   OR (date_fin - date_debut) > 3
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 3. Inverser une condition avec NOT
-- -----------------------------------------------------------------------------
-- Toutes les absences NON justifiées
SELECT eleve_id, date_debut, motif
FROM absences
WHERE NOT justifiee
LIMIT 10;

-- Élèves dont la nationalité n'est pas Française
SELECT nom, prenom, nationalite
FROM eleves
WHERE nationalite <> 'Française'
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 4. Chercher un motif dans une chaîne (LIKE / ILIKE)
--    % = n'importe quelle séquence de caractères
--    _ = exactement un caractère
--    ILIKE = insensible à la casse (PostgreSQL)
-- -----------------------------------------------------------------------------
-- Élèves dont le nom commence par "D"
SELECT nom, prenom
FROM eleves
WHERE nom LIKE 'D%'
LIMIT 10;

-- Écoles contenant "Saint" dans leur nom (insensible à la casse)
SELECT nom, ville_id
FROM ecoles
WHERE nom ILIKE '%saint%';

-- Matières dont le code fait exactement 2 lettres
SELECT nom, code
FROM matieres
WHERE code LIKE '__';


-- -----------------------------------------------------------------------------
-- 5. Filtrer sur une liste de valeurs (IN)
-- -----------------------------------------------------------------------------
-- Élèves de nationalité béninoise ou sénégalaise
SELECT nom, prenom, nationalite
FROM eleves
WHERE nationalite IN ('Béninoise', 'Sénégalaise')
LIMIT 10;

-- Évaluations de type composition ou examen
SELECT titre, type_evaluation, trimestre
FROM evaluations
WHERE type_evaluation IN ('composition', 'examen')
LIMIT 10;

-- Exclure certains types d'écoles
SELECT nom, type_ecole
FROM ecoles
WHERE type_ecole NOT IN ('communautaire');


-- -----------------------------------------------------------------------------
-- 6. Filtrer sur un intervalle (BETWEEN … AND …)
--    BETWEEN est inclusif des deux bornes.
-- -----------------------------------------------------------------------------
-- Notes comprises entre 10 et 14 (passable à assez bien)
SELECT eleve_id, note
FROM notes
WHERE note BETWEEN 10 AND 14
LIMIT 10;

-- Années scolaires dont le début est entre 2020 et 2022
SELECT libelle, date_debut
FROM annees_scolaires
WHERE date_debut BETWEEN '2020-01-01' AND '2022-12-31';

-- Élèves nés entre 2005 et 2010
SELECT nom, prenom, date_naissance
FROM eleves
WHERE date_naissance BETWEEN '2005-01-01' AND '2010-12-31'
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 7. Tester les valeurs nulles (IS NULL / IS NOT NULL)
--    ATTENTION : on ne peut pas utiliser = NULL, il faut IS NULL.
-- -----------------------------------------------------------------------------
-- Notes sans observation (observation est NULL)
SELECT eleve_id, note, observation
FROM notes
WHERE observation IS NULL
LIMIT 10;

-- Notes avec une observation renseignée
SELECT eleve_id, note, observation
FROM notes
WHERE observation IS NOT NULL
LIMIT 10;

-- Absences sans motif déclaré
SELECT eleve_id, date_debut, date_fin
FROM absences
WHERE motif IS NULL
LIMIT 10;

-- Enseignants sans adresse e-mail
SELECT nom, prenom, specialite
FROM enseignants
WHERE email IS NULL
LIMIT 10;


-- -----------------------------------------------------------------------------
-- 8. Combiner plusieurs types de filtres
-- -----------------------------------------------------------------------------
-- Notes faibles (< 10) des compositions du 1er trimestre
SELECT n.eleve_id, n.note, e.titre, e.trimestre
FROM notes n
JOIN evaluations e ON e.id = n.evaluation_id
WHERE n.note < 10
  AND e.type_evaluation = 'composition'
  AND e.trimestre = 1
LIMIT 15;

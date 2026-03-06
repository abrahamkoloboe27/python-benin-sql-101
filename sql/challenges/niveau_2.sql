-- =============================================================================
-- SQL 101 – Challenges Niveau 2 🟡 Intermédiaire
-- =============================================================================
-- Thèmes : GROUP BY, HAVING, INNER JOIN, LEFT JOIN, fonctions
-- Prérequis : Fiches 01 à 07 + Niveau 1 complété
-- =============================================================================


-- ============================================================
-- Exercice 1 – Répartition des élèves par genre
-- ============================================================
-- Énoncé : Afficher le nombre d'élèves par genre (M / F).
-- Indice  : Deux lignes attendues.
-- Tables  : eleves
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 2 – Nombre de classes par niveau scolaire
-- ============================================================
-- Énoncé : Pour chaque niveau (nom du niveau), afficher
--          le nombre total de classes créées sur toutes les années.
--          Trier par nombre de classes décroissant.
-- Tables  : classes, niveaux
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 3 – Moyenne des notes par matière
-- ============================================================
-- Énoncé : Afficher la moyenne des notes par matière (nom de la matière),
--          arrondie à 2 décimales. Trier du meilleur au moins bon.
-- Tables  : notes, evaluations, matieres
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 4 – Élèves avec plus de 2 absences
-- ============================================================
-- Énoncé : Lister les eleve_id ayant plus de 2 absences enregistrées,
--          avec le nombre d'absences. Trier par nombre décroissant.
-- Indice  : HAVING COUNT(*) > 2
-- Tables  : absences
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 5 – Nom complet des élèves et leur ville
-- ============================================================
-- Énoncé : Afficher le nom complet (prénom + nom) de chaque élève
--          avec le nom de leur ville de résidence.
--          Inclure les élèves sans ville renseignée (NULL).
-- Indice  : LEFT JOIN — certains élèves peuvent ne pas avoir de ville.
-- Tables  : eleves, villes
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 6 – Taux de réussite par type d'évaluation
-- ============================================================
-- Énoncé : Pour chaque type d'évaluation, afficher :
--            - le nombre total de notes
--            - le nombre de notes >= 10
--            - le taux de réussite en % (arrondi à 1 décimale)
-- Tables  : notes, evaluations
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 7 – Ancienneté des enseignants
-- ============================================================
-- Énoncé : Afficher les 10 enseignants les plus anciens
--          (nom, prénom, date_embauche, nombre d'années depuis embauche).
-- Indice  : EXTRACT(YEAR FROM AGE(date_embauche)) ou
--           DATE_PART('year', AGE(date_embauche))
-- Tables  : enseignants
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 8 – Absences par motif
-- ============================================================
-- Énoncé : Afficher le nombre d'absences pour chaque motif déclaré.
--          Les absences sans motif doivent apparaître sous le libellé
--          "Non renseigné".
-- Indice  : COALESCE(motif, 'Non renseigné')
-- Tables  : absences
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 9 – Matières n'ayant aucune note
-- ============================================================
-- Énoncé : Y a-t-il des matières pour lesquelles aucune note
--          n'a été saisie ? Afficher leur nom et leur code.
-- Indice  : LEFT JOIN + IS NULL (anti-join)
-- Tables  : matieres, evaluations, notes
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 10 – Bulletin du 3ème trimestre par école
-- ============================================================
-- Énoncé : Pour chaque école (nom de l'école), afficher la
--          moyenne générale moyenne de tous les bulletins
--          du 3ème trimestre, arrondie à 2 décimales.
--          Trier par moyenne décroissante.
-- Tables  : bulletins, classes, ecoles
-- ============================================================

-- Écrivez votre requête ici :

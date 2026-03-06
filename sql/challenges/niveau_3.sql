-- =============================================================================
-- SQL 101 – Challenges Niveau 3 🔴 Avancé
-- =============================================================================
-- Thèmes : Sous-requêtes, CTEs (WITH), Window Functions, agrégats complexes
-- Prérequis : Niveaux 1 et 2 complétés
-- =============================================================================
-- 💡 Notions clés à connaître pour ce niveau :
--
--   Sous-requête scalaire :  SELECT ... WHERE x = (SELECT MAX(x) FROM ...)
--   Sous-requête IN        :  SELECT ... WHERE id IN (SELECT id FROM ...)
--   CTE (WITH)             :  WITH nom AS (SELECT ...) SELECT ... FROM nom
--   Window function        :  RANK() OVER (PARTITION BY ... ORDER BY ...)
-- =============================================================================


-- ============================================================
-- Exercice 1 – L'élève avec la meilleure note de toute la base
-- ============================================================
-- Énoncé : Trouver le nom et prénom de l'élève(s) ayant obtenu
--          la note la plus élevée dans toute la base, ainsi que
--          la matière et l'évaluation concernée.
-- Indice  : Sous-requête scalaire : WHERE n.note = (SELECT MAX(note) FROM notes)
-- Tables  : notes, eleves, evaluations, matieres
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 2 – Classement des élèves par moyenne (CTE)
-- ============================================================
-- Énoncé : À l'aide d'une CTE, calculer la moyenne générale
--          de chaque élève (sur tous ses bulletins, tous trimestres
--          et années confondus). Afficher les 10 meilleurs élèves
--          avec leur rang, nom complet et moyenne arrondie à 2 décimales.
-- Indice  : WITH moyennes AS (...) SELECT ... FROM moyennes ORDER BY ... LIMIT 10
-- Tables  : bulletins, eleves
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 3 – Rang dans la classe (Window Function)
-- ============================================================
-- Énoncé : Pour l'année scolaire 2023-2024 et le 1er trimestre,
--          afficher pour chaque élève son nom complet, sa classe,
--          sa moyenne générale et son rang DANS SA CLASSE
--          (1 = meilleure moyenne, ex-æquo autorisés).
-- Indice  : RANK() OVER (PARTITION BY classe_id ORDER BY moyenne_generale DESC)
-- Tables  : bulletins, eleves, classes, annees_scolaires
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 4 – Progression d'un élève au fil des années
-- ============================================================
-- Énoncé : Choisir un eleve_id quelconque (ex : 1).
--          Afficher sa moyenne générale au 3ème trimestre
--          pour chaque année scolaire où il a un bulletin,
--          ainsi que l'écart avec l'année précédente
--          (NULL pour la première année).
-- Indice  : LAG(moyenne_generale) OVER (ORDER BY date_debut)
-- Tables  : bulletins, annees_scolaires
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 5 – Écoles avec un taux d'absence > 20 %
-- ============================================================
-- Énoncé : Calculer, pour chaque école, le pourcentage d'élèves
--          inscrits ayant eu AU MOINS UNE absence sur toute la
--          période. Afficher uniquement les écoles où ce taux
--          dépasse 20 %. Inclure le nom de l'école et le taux
--          arrondi à 1 décimale.
-- Indice  : CTE ou sous-requête pour compter les élèves avec absences
-- Tables  : ecoles, classes, inscriptions, absences
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 6 – Top 3 des matières par cycle
-- ============================================================
-- Énoncé : Pour chaque cycle scolaire (primaire, college, lycee),
--          identifier les 3 matières ayant la plus haute moyenne
--          de notes. Afficher : cycle, rang, matière, moyenne.
-- Indice  : Window function RANK() ou DENSE_RANK() OVER (PARTITION BY cycle ...)
-- Tables  : matieres, evaluations, notes
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 7 – Élèves ayant progressé entre T1 et T3
-- ============================================================
-- Énoncé : Sur l'année scolaire la plus récente, trouver les
--          élèves dont la moyenne générale au 3ème trimestre
--          est strictement supérieure à celle du 1er trimestre.
--          Afficher : nom, prénom, moy_t1, moy_t3, progression.
-- Indice  : Jointure d'une table avec elle-même (self-join) ou CASE/FILTER.
-- Tables  : bulletins, eleves, annees_scolaires
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 8 – Détection des anomalies de notes
-- ============================================================
-- Énoncé : Trouver les évaluations pour lesquelles au moins
--          un élève a obtenu une note SUPÉRIEURE à la note_max
--          définie. Afficher : titre de l'évaluation, note_max,
--          note obtenue, eleve_id.
-- Indice  : JOIN notes + evaluations, WHERE n.note > ev.note_max
-- Tables  : notes, evaluations
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 9 – Tableau de bord annuel (requête synthèse)
-- ============================================================
-- Énoncé : Produire un tableau de bord par année scolaire avec :
--            - Nombre d'élèves actifs
--            - Nombre de redoublants
--            - Moyenne générale des bulletins du T3
--            - Nombre total d'absences
--            - Taux de réussite au T3 (moyenne_generale >= 10)
--          Trier par année croissante.
-- Tables  : annees_scolaires, inscriptions, bulletins, absences
-- ============================================================

-- Écrivez votre requête ici :


-- ============================================================
-- Exercice 10 – Requête libre
-- ============================================================
-- Énoncé : Formulez vous-même une question analytique sur cette
--          base de données et écrivez la requête SQL pour y répondre.
--
-- Quelques idées :
--   - Quel enseignant couvre le plus de matières différentes ?
--   - Dans quelle ville se trouvent les meilleures écoles (par moyenne) ?
--   - Quel est le taux de redoublement par cycle scolaire ?
--   - Existe-t-il une corrélation entre le nombre d'absences et la moyenne ?
-- ============================================================

-- Votre question :
-- ...

-- Votre requête :

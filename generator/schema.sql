-- =============================================================================
-- Schéma de la base de données : Analyse d'un Système Scolaire
-- =============================================================================
-- Description : Ce script crée toutes les tables nécessaires à la modélisation
--               d'un système scolaire multi-pays, multi-villes, multi-écoles,
--               avec suivi des élèves sur plusieurs années scolaires.
-- =============================================================================

-- Suppression des tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS bulletins CASCADE;
DROP TABLE IF EXISTS absences CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS enseignements CASCADE;
DROP TABLE IF EXISTS inscriptions CASCADE;
DROP TABLE IF EXISTS eleves CASCADE;
DROP TABLE IF EXISTS enseignants CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS matieres CASCADE;
DROP TABLE IF EXISTS niveaux CASCADE;
DROP TABLE IF EXISTS annees_scolaires CASCADE;
DROP TABLE IF EXISTS ecoles CASCADE;
DROP TABLE IF EXISTS villes CASCADE;
DROP TABLE IF EXISTS pays CASCADE;

-- =============================================================================
-- TABLE : pays
-- =============================================================================
CREATE TABLE pays (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL UNIQUE,
    code_iso    CHAR(2)      NOT NULL UNIQUE,   -- Code ISO 3166-1 alpha-2
    continent   VARCHAR(50)  NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pays IS 'Référentiel des pays.';
COMMENT ON COLUMN pays.code_iso IS 'Code ISO 3166-1 alpha-2 (ex: FR, BJ, SN).';

-- =============================================================================
-- TABLE : villes
-- =============================================================================
CREATE TABLE villes (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL,
    pays_id     INT          NOT NULL REFERENCES pays(id) ON DELETE RESTRICT,
    code_postal VARCHAR(20),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nom, pays_id)
);

COMMENT ON TABLE villes IS 'Villes rattachées à un pays.';

-- =============================================================================
-- TABLE : ecoles
-- =============================================================================
CREATE TABLE ecoles (
    id              SERIAL PRIMARY KEY,
    nom             VARCHAR(150) NOT NULL,
    adresse         VARCHAR(255),
    ville_id        INT          NOT NULL REFERENCES villes(id) ON DELETE RESTRICT,
    type_ecole      VARCHAR(20)  NOT NULL CHECK (type_ecole IN ('public', 'prive', 'communautaire')),
    niveau_ecole    VARCHAR(20)  NOT NULL CHECK (niveau_ecole IN ('primaire', 'college', 'lycee', 'mixte')),
    telephone       VARCHAR(20),
    email           VARCHAR(150),
    directeur       VARCHAR(150),
    date_creation   DATE,
    capacite_max    INT          CHECK (capacite_max > 0),
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ecoles IS 'Établissements scolaires.';
COMMENT ON COLUMN ecoles.type_ecole IS 'Public, privé ou communautaire.';
COMMENT ON COLUMN ecoles.niveau_ecole IS 'Niveau d''enseignement principal.';

-- =============================================================================
-- TABLE : annees_scolaires
-- =============================================================================
CREATE TABLE annees_scolaires (
    id          SERIAL PRIMARY KEY,
    libelle     VARCHAR(20)  NOT NULL UNIQUE,   -- Ex: "2022-2023"
    date_debut  DATE         NOT NULL,
    date_fin    DATE         NOT NULL,
    est_active  BOOLEAN      DEFAULT FALSE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CHECK (date_fin > date_debut)
);

COMMENT ON TABLE annees_scolaires IS 'Années scolaires (ex: 2022-2023).';

-- =============================================================================
-- TABLE : niveaux
-- =============================================================================
CREATE TABLE niveaux (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(50)  NOT NULL UNIQUE,   -- Ex: "6ème", "5ème", "CP", "CM2"
    ordre       INT          NOT NULL UNIQUE,   -- Ordre croissant dans le cursus
    cycle       VARCHAR(20)  NOT NULL CHECK (cycle IN ('primaire', 'college', 'lycee')),
    description VARCHAR(255),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE niveaux IS 'Niveaux scolaires (CP, CE1, 6ème, 5ème, 2nde, etc.).';
COMMENT ON COLUMN niveaux.ordre IS 'Rang dans le parcours scolaire (1 = première année).';

-- =============================================================================
-- TABLE : classes
-- =============================================================================
CREATE TABLE classes (
    id                  SERIAL PRIMARY KEY,
    nom                 VARCHAR(50)  NOT NULL,   -- Ex: "6ème A", "CM2 B"
    ecole_id            INT          NOT NULL REFERENCES ecoles(id) ON DELETE CASCADE,
    niveau_id           INT          NOT NULL REFERENCES niveaux(id) ON DELETE RESTRICT,
    annee_scolaire_id   INT          NOT NULL REFERENCES annees_scolaires(id) ON DELETE RESTRICT,
    effectif_max        INT          NOT NULL DEFAULT 40 CHECK (effectif_max > 0),
    salle               VARCHAR(20),
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (nom, ecole_id, annee_scolaire_id)
);

COMMENT ON TABLE classes IS 'Classes par école, niveau et année scolaire.';

-- =============================================================================
-- TABLE : matieres
-- =============================================================================
CREATE TABLE matieres (
    id          SERIAL PRIMARY KEY,
    nom         VARCHAR(100) NOT NULL UNIQUE,
    code        VARCHAR(10)  NOT NULL UNIQUE,   -- Ex: "MATH", "FR", "HG"
    coefficient NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (coefficient > 0),
    cycle       VARCHAR(20)  CHECK (cycle IN ('primaire', 'college', 'lycee', 'tous')),
    description TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE matieres IS 'Matières enseignées.';
COMMENT ON COLUMN matieres.coefficient IS 'Coefficient de la matière dans le calcul de la moyenne.';

-- =============================================================================
-- TABLE : enseignants
-- =============================================================================
CREATE TABLE enseignants (
    id              SERIAL PRIMARY KEY,
    nom             VARCHAR(100) NOT NULL,
    prenom          VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE,
    telephone       VARCHAR(20),
    genre           CHAR(1)      CHECK (genre IN ('M', 'F')),
    date_naissance  DATE,
    date_embauche   DATE,
    specialite      VARCHAR(100),   -- Matière principale enseignée
    ecole_id        INT          REFERENCES ecoles(id) ON DELETE SET NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE enseignants IS 'Corps enseignant.';

-- =============================================================================
-- TABLE : enseignements  (affectation enseignant → classe × matière)
-- =============================================================================
CREATE TABLE enseignements (
    id                  SERIAL PRIMARY KEY,
    enseignant_id       INT NOT NULL REFERENCES enseignants(id) ON DELETE CASCADE,
    classe_id           INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    matiere_id          INT NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
    heures_hebdo        NUMERIC(4,1) DEFAULT 2.0 CHECK (heures_hebdo > 0),
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (enseignant_id, classe_id, matiere_id)
);

COMMENT ON TABLE enseignements IS 'Affectation des enseignants aux classes et matières.';

-- =============================================================================
-- TABLE : eleves
-- =============================================================================
CREATE TABLE eleves (
    id                  SERIAL PRIMARY KEY,
    nom                 VARCHAR(100) NOT NULL,
    prenom              VARCHAR(100) NOT NULL,
    date_naissance      DATE         NOT NULL,
    genre               CHAR(1)      NOT NULL CHECK (genre IN ('M', 'F')),
    adresse             VARCHAR(255),
    ville_id            INT          REFERENCES villes(id) ON DELETE SET NULL,
    email_parent        VARCHAR(150),
    telephone_parent    VARCHAR(20),
    nom_parent          VARCHAR(200),
    date_inscription    DATE         NOT NULL,
    nationalite         VARCHAR(50),
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE eleves IS 'Élèves inscrits dans le système.';

-- =============================================================================
-- TABLE : inscriptions  (élève → classe par année scolaire)
-- Permet de suivre le passage d'un élève d'une classe à l'autre.
-- =============================================================================
CREATE TABLE inscriptions (
    id                  SERIAL PRIMARY KEY,
    eleve_id            INT          NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    classe_id           INT          NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    annee_scolaire_id   INT          NOT NULL REFERENCES annees_scolaires(id) ON DELETE RESTRICT,
    date_inscription    DATE         NOT NULL,
    statut              VARCHAR(20)  NOT NULL DEFAULT 'actif'
                            CHECK (statut IN ('actif', 'transfere', 'abandonne', 'diplome', 'redoublant')),
    motif_sortie        VARCHAR(255),
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (eleve_id, annee_scolaire_id)   -- Un élève ne peut être dans qu'une seule classe par an
);

COMMENT ON TABLE inscriptions IS 'Inscription d''un élève dans une classe pour une année scolaire.';
COMMENT ON COLUMN inscriptions.statut IS 'actif, transféré, abandonné, diplômé ou redoublant.';

-- =============================================================================
-- TABLE : evaluations  (compositions / devoirs / examens)
-- =============================================================================
CREATE TABLE evaluations (
    id                  SERIAL PRIMARY KEY,
    titre               VARCHAR(200) NOT NULL,
    matiere_id          INT          NOT NULL REFERENCES matieres(id) ON DELETE RESTRICT,
    classe_id           INT          NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    annee_scolaire_id   INT          NOT NULL REFERENCES annees_scolaires(id) ON DELETE RESTRICT,
    type_evaluation     VARCHAR(20)  NOT NULL CHECK (type_evaluation IN ('devoir', 'composition', 'examen', 'interrogation')),
    trimestre           SMALLINT     NOT NULL CHECK (trimestre IN (1, 2, 3)),
    date_debut          DATE         NOT NULL,   -- Date de début de la composition
    date_fin            DATE,                    -- Date de fin (si épreuve sur plusieurs jours)
    note_max            NUMERIC(5,2) NOT NULL DEFAULT 20.0 CHECK (note_max > 0),
    coefficient         NUMERIC(4,2) NOT NULL DEFAULT 1.0 CHECK (coefficient > 0),
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CHECK (date_fin IS NULL OR date_fin >= date_debut)
);

COMMENT ON TABLE evaluations IS 'Évaluations (devoirs, compositions, examens).';
COMMENT ON COLUMN evaluations.date_debut IS 'Date de début de l''épreuve / composition.';
COMMENT ON COLUMN evaluations.trimestre IS 'Trimestre de l''évaluation (1, 2 ou 3).';

-- =============================================================================
-- TABLE : notes
-- =============================================================================
CREATE TABLE notes (
    id              SERIAL PRIMARY KEY,
    evaluation_id   INT          NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    eleve_id        INT          NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    note            NUMERIC(5,2) NOT NULL CHECK (note >= 0),
    observation     TEXT,
    date_saisie     DATE         NOT NULL DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (evaluation_id, eleve_id)
);

COMMENT ON TABLE notes IS 'Notes obtenues par les élèves aux évaluations.';

-- Contrainte de cohérence : la note ne doit pas dépasser la note maximale
-- (vérifiée au niveau applicatif car référence croisée avec evaluations)

-- =============================================================================
-- TABLE : absences
-- =============================================================================
CREATE TABLE absences (
    id              SERIAL PRIMARY KEY,
    eleve_id        INT          NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    classe_id       INT          NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date_debut      DATE         NOT NULL,
    date_fin        DATE         NOT NULL,
    motif           VARCHAR(255),
    justifiee       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CHECK (date_fin >= date_debut)
);

COMMENT ON TABLE absences IS 'Absences des élèves.';

-- =============================================================================
-- TABLE : bulletins  (relevés de notes trimestriels)
-- =============================================================================
CREATE TABLE bulletins (
    id                  SERIAL PRIMARY KEY,
    eleve_id            INT          NOT NULL REFERENCES eleves(id) ON DELETE CASCADE,
    classe_id           INT          NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    annee_scolaire_id   INT          NOT NULL REFERENCES annees_scolaires(id) ON DELETE RESTRICT,
    trimestre           SMALLINT     NOT NULL CHECK (trimestre IN (1, 2, 3)),
    moyenne_generale    NUMERIC(5,2) CHECK (moyenne_generale >= 0 AND moyenne_generale <= 20),
    rang                INT          CHECK (rang > 0),
    appreciation        TEXT,
    date_emission       DATE,
    created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (eleve_id, annee_scolaire_id, trimestre)
);

COMMENT ON TABLE bulletins IS 'Bulletins de notes trimestriels des élèves.';
COMMENT ON COLUMN bulletins.moyenne_generale IS 'Moyenne générale pondérée par les coefficients, sur 20.';

-- =============================================================================
-- INDEX pour optimiser les requêtes fréquentes
-- =============================================================================
CREATE INDEX idx_inscriptions_eleve   ON inscriptions(eleve_id);
CREATE INDEX idx_inscriptions_classe  ON inscriptions(classe_id);
CREATE INDEX idx_inscriptions_annee   ON inscriptions(annee_scolaire_id);
CREATE INDEX idx_notes_evaluation     ON notes(evaluation_id);
CREATE INDEX idx_notes_eleve          ON notes(eleve_id);
CREATE INDEX idx_evaluations_classe   ON evaluations(classe_id);
CREATE INDEX idx_evaluations_annee    ON evaluations(annee_scolaire_id);
CREATE INDEX idx_bulletins_eleve      ON bulletins(eleve_id);
CREATE INDEX idx_absences_eleve       ON absences(eleve_id);
CREATE INDEX idx_classes_ecole        ON classes(ecole_id);
CREATE INDEX idx_classes_annee        ON classes(annee_scolaire_id);

-- =============================================================================
-- VUE : moyenne par élève, matière et année scolaire
-- =============================================================================
CREATE OR REPLACE VIEW v_moyennes_eleves AS
SELECT
    e.id            AS eleve_id,
    e.nom           AS eleve_nom,
    e.prenom        AS eleve_prenom,
    m.nom           AS matiere,
    m.coefficient   AS coefficient_matiere,
    a.libelle       AS annee_scolaire,
    i.classe_id,
    c.nom           AS classe_nom,
    ROUND(
        SUM(n.note * ev.coefficient) / NULLIF(SUM(ev.coefficient), 0),
        2
    )               AS moyenne_matiere
FROM notes n
JOIN evaluations  ev ON ev.id = n.evaluation_id
JOIN matieres     m  ON m.id  = ev.matiere_id
JOIN eleves       e  ON e.id  = n.eleve_id
JOIN inscriptions i  ON i.eleve_id = e.id AND i.annee_scolaire_id = ev.annee_scolaire_id
JOIN classes      c  ON c.id  = i.classe_id
JOIN annees_scolaires a ON a.id = ev.annee_scolaire_id
GROUP BY e.id, e.nom, e.prenom, m.nom, m.coefficient, a.libelle, i.classe_id, c.nom;

COMMENT ON VIEW v_moyennes_eleves IS 'Moyenne de chaque élève par matière et année scolaire.';

-- =============================================================================
-- VUE : classement général par classe et trimestre
-- =============================================================================
CREATE OR REPLACE VIEW v_classement_classe AS
SELECT
    b.classe_id,
    c.nom       AS classe_nom,
    a.libelle   AS annee_scolaire,
    b.trimestre,
    e.id        AS eleve_id,
    e.nom       AS eleve_nom,
    e.prenom    AS eleve_prenom,
    b.moyenne_generale,
    b.rang,
    b.appreciation
FROM bulletins b
JOIN eleves           e ON e.id = b.eleve_id
JOIN classes          c ON c.id = b.classe_id
JOIN annees_scolaires a ON a.id = b.annee_scolaire_id
ORDER BY a.libelle, b.classe_id, b.trimestre, b.rang;

COMMENT ON VIEW v_classement_classe IS 'Classement des élèves par classe, trimestre et année scolaire.';

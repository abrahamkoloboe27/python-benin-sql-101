const TABLES_DOC = [
  {
    name: 'pays',
    icon: '🌍',
    desc: 'Référentiel des pays du monde (3 pays dans notre jeu de données).',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'nom', type: 'TEXT', nullable: false, desc: 'Nom complet (ex: Bénin)' },
      { col: 'code_iso', type: 'TEXT', nullable: false, desc: 'Code ISO 3166-1 alpha-2 (ex: BJ)' },
      { col: 'continent', type: 'TEXT', nullable: false, desc: 'Continent (ex: Afrique)' },
    ],
    example: 'SELECT * FROM pays;',
  },
  {
    name: 'villes',
    icon: '🏙️',
    desc: 'Villes rattachées à un pays.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'nom', type: 'TEXT', nullable: false, desc: 'Nom de la ville' },
      { col: 'pays_id', type: 'INTEGER → pays', nullable: false, desc: 'Clé étrangère vers pays' },
      { col: 'code_postal', type: 'TEXT', nullable: true, desc: 'Code postal (optionnel)' },
    ],
    example: 'SELECT v.nom, p.nom AS pays\nFROM villes v\nJOIN pays p ON v.pays_id = p.id;',
  },
  {
    name: 'ecoles',
    icon: '🏫',
    desc: "Établissements scolaires. Localisés dans une ville, avec un type (public/privé/communautaire) et un niveau principal.",
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'nom', type: 'TEXT', nullable: false, desc: "Nom de l'établissement" },
      { col: 'ville_id', type: 'INTEGER → villes', nullable: false, desc: 'Ville de localisation' },
      { col: 'type_ecole', type: "TEXT: 'public'|'prive'|'communautaire'", nullable: false, desc: 'Type de gestion' },
      { col: 'niveau_ecole', type: "TEXT: 'primaire'|'college'|'lycee'|'mixte'", nullable: false, desc: "Niveau d'enseignement" },
      { col: 'capacite_max', type: 'INTEGER', nullable: true, desc: "Capacité maximale d'élèves" },
      { col: 'directeur', type: 'TEXT', nullable: true, desc: 'Nom du directeur' },
    ],
    example: "SELECT nom, type_ecole, capacite_max\nFROM ecoles\nWHERE type_ecole = 'public'\nORDER BY capacite_max DESC;",
  },
  {
    name: 'annees_scolaires',
    icon: '📅',
    desc: 'Années scolaires couvrant 2019-2020 → 2024-2025 (une seule active à la fois).',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'libelle', type: 'TEXT', nullable: false, desc: "Label lisible (ex: '2022-2023')" },
      { col: 'date_debut', type: 'TEXT (DATE)', nullable: false, desc: "Début de l'année" },
      { col: 'date_fin', type: 'TEXT (DATE)', nullable: false, desc: "Fin de l'année" },
      { col: 'est_active', type: 'INTEGER (0/1)', nullable: false, desc: "1 = année en cours" },
    ],
    example: 'SELECT * FROM annees_scolaires WHERE est_active = 1;',
  },
  {
    name: 'niveaux',
    icon: '📚',
    desc: "Niveaux scolaires du CP jusqu'en Terminale, organisés par cycle.",
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'nom', type: 'TEXT', nullable: false, desc: "Intitulé court (ex: '6ème')" },
      { col: 'ordre', type: 'INTEGER', nullable: false, desc: 'Rang dans le cursus (1=CP)' },
      { col: 'cycle', type: "TEXT: 'primaire'|'college'|'lycee'", nullable: false, desc: 'Cycle scolaire' },
      { col: 'description', type: 'TEXT', nullable: true, desc: "Description longue (ex: 'Sixième')" },
    ],
    example: "SELECT nom, ordre, cycle FROM niveaux ORDER BY ordre;",
  },
  {
    name: 'matieres',
    icon: '📐',
    desc: 'Matières enseignées avec leurs coefficients pour le calcul de la moyenne.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'nom', type: 'TEXT', nullable: false, desc: 'Nom de la matière' },
      { col: 'code', type: 'TEXT', nullable: false, desc: "Code court (ex: 'MATH')" },
      { col: 'coefficient', type: 'REAL', nullable: false, desc: 'Coefficient (défaut 1.0)' },
      { col: 'cycle', type: "TEXT: 'primaire'|'college'|'lycee'|'tous'", nullable: true, desc: 'Cycle concerné' },
    ],
    example: 'SELECT nom, code, coefficient FROM matieres ORDER BY coefficient DESC;',
  },
  {
    name: 'enseignants',
    icon: '👨‍🏫',
    desc: 'Corps enseignant rattaché aux établissements.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'nom', type: 'TEXT', nullable: false, desc: 'Nom de famille' },
      { col: 'prenom', type: 'TEXT', nullable: false, desc: 'Prénom' },
      { col: 'genre', type: "TEXT: 'M'|'F'", nullable: true, desc: 'Genre' },
      { col: 'date_embauche', type: 'TEXT (DATE)', nullable: true, desc: "Date d'embauche" },
      { col: 'specialite', type: 'TEXT', nullable: true, desc: 'Matière principale enseignée' },
      { col: 'ecole_id', type: 'INTEGER → ecoles', nullable: true, desc: "École de rattachement" },
    ],
    example: "SELECT nom, prenom, specialite\nFROM enseignants\nORDER BY date_embauche ASC\nLIMIT 5;",
  },
  {
    name: 'classes',
    icon: '🏛️',
    desc: 'Classes formées pour une école, un niveau et une année scolaire donnés.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'nom', type: 'TEXT', nullable: false, desc: "Intitulé (ex: '6ème A')" },
      { col: 'ecole_id', type: 'INTEGER → ecoles', nullable: false, desc: 'École' },
      { col: 'niveau_id', type: 'INTEGER → niveaux', nullable: false, desc: 'Niveau scolaire' },
      { col: 'annee_scolaire_id', type: 'INTEGER → annees_scolaires', nullable: false, desc: 'Année scolaire' },
      { col: 'effectif_max', type: 'INTEGER', nullable: false, desc: 'Effectif maximum (défaut: 40)' },
    ],
    example: 'SELECT c.nom, e.nom AS ecole, n.nom AS niveau\nFROM classes c\nJOIN ecoles e ON c.ecole_id = e.id\nJOIN niveaux n ON c.niveau_id = n.id\nWHERE c.annee_scolaire_id = 6\nLIMIT 10;',
  },
  {
    name: 'eleves',
    icon: '👨‍🎓',
    desc: 'Élèves inscrits dans le système avec leurs informations personnelles.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'nom', type: 'TEXT', nullable: false, desc: 'Nom de famille' },
      { col: 'prenom', type: 'TEXT', nullable: false, desc: 'Prénom' },
      { col: 'date_naissance', type: 'TEXT (DATE)', nullable: false, desc: 'Date de naissance' },
      { col: 'genre', type: "TEXT: 'M'|'F'", nullable: false, desc: 'Genre' },
      { col: 'ville_id', type: 'INTEGER → villes', nullable: true, desc: 'Ville de résidence' },
      { col: 'nationalite', type: 'TEXT', nullable: true, desc: 'Nationalité' },
    ],
    example: "SELECT nom, prenom, genre, nationalite\nFROM eleves\nWHERE genre = 'F'\nORDER BY nom\nLIMIT 10;",
  },
  {
    name: 'inscriptions',
    icon: '📋',
    desc: "Parcours scolaire : chaque ligne représente l'inscription d'un élève dans une classe pour une année.",
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'eleve_id', type: 'INTEGER → eleves', nullable: false, desc: 'Élève' },
      { col: 'classe_id', type: 'INTEGER → classes', nullable: false, desc: 'Classe' },
      { col: 'annee_scolaire_id', type: 'INTEGER → annees_scolaires', nullable: false, desc: 'Année' },
      { col: 'statut', type: "TEXT: 'actif'|'redoublant'|'transfere'|'abandonne'|'diplome'", nullable: false, desc: 'Statut' },
    ],
    example: "SELECT COUNT(*) FROM inscriptions WHERE statut = 'actif';",
  },
  {
    name: 'evaluations',
    icon: '✏️',
    desc: 'Évaluations organisées dans une classe pour une matière et un trimestre donnés.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'titre', type: 'TEXT', nullable: false, desc: "Intitulé de l'évaluation" },
      { col: 'matiere_id', type: 'INTEGER → matieres', nullable: false, desc: 'Matière' },
      { col: 'classe_id', type: 'INTEGER → classes', nullable: false, desc: 'Classe' },
      { col: 'type_evaluation', type: "TEXT: 'devoir'|'composition'|'examen'|'interrogation'", nullable: false, desc: 'Type' },
      { col: 'trimestre', type: 'INTEGER: 1|2|3', nullable: false, desc: 'Trimestre' },
      { col: 'coefficient', type: 'REAL', nullable: false, desc: 'Coefficient de pondération' },
    ],
    example: "SELECT type_evaluation, COUNT(*) AS nb\nFROM evaluations\nGROUP BY type_evaluation;",
  },
  {
    name: 'notes',
    icon: '🔢',
    desc: 'Note obtenue par un élève à une évaluation (sur 20). Un élève ne peut avoir qu\'une note par évaluation.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'evaluation_id', type: 'INTEGER → evaluations', nullable: false, desc: 'Évaluation' },
      { col: 'eleve_id', type: 'INTEGER → eleves', nullable: false, desc: 'Élève' },
      { col: 'note', type: 'REAL (0–20)', nullable: false, desc: 'Note obtenue' },
      { col: 'observation', type: 'TEXT', nullable: true, desc: 'Commentaire du professeur' },
      { col: 'date_saisie', type: 'TEXT (DATE)', nullable: false, desc: 'Date de saisie' },
    ],
    example: 'SELECT AVG(note) AS moyenne_globale FROM notes;',
  },
  {
    name: 'absences',
    icon: '🚪',
    desc: 'Absences des élèves, justifiées ou non.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'eleve_id', type: 'INTEGER → eleves', nullable: false, desc: 'Élève absent' },
      { col: 'classe_id', type: 'INTEGER → classes', nullable: false, desc: 'Classe au moment de l\'absence' },
      { col: 'date_debut', type: 'TEXT (DATE)', nullable: false, desc: 'Premier jour' },
      { col: 'date_fin', type: 'TEXT (DATE)', nullable: false, desc: 'Dernier jour' },
      { col: 'motif', type: 'TEXT', nullable: true, desc: 'Motif déclaré (peut être NULL)' },
      { col: 'justifiee', type: 'INTEGER (0/1)', nullable: false, desc: '1 = justifiée' },
    ],
    example: "SELECT motif, COUNT(*) AS nb\nFROM absences\nWHERE justifiee = 1\nGROUP BY motif\nORDER BY nb DESC;",
  },
  {
    name: 'bulletins',
    icon: '📊',
    desc: 'Bulletin scolaire trimestriel — synthèse des résultats d\'un élève pour un trimestre.',
    columns: [
      { col: 'id', type: 'INTEGER', pk: true, nullable: false, desc: 'Clé primaire' },
      { col: 'eleve_id', type: 'INTEGER → eleves', nullable: false, desc: 'Élève' },
      { col: 'classe_id', type: 'INTEGER → classes', nullable: false, desc: 'Classe' },
      { col: 'annee_scolaire_id', type: 'INTEGER → annees_scolaires', nullable: false, desc: 'Année' },
      { col: 'trimestre', type: 'INTEGER: 1|2|3', nullable: false, desc: 'Trimestre' },
      { col: 'moyenne_generale', type: 'REAL (0–20)', nullable: true, desc: 'Moyenne pondérée sur 20' },
      { col: 'rang', type: 'INTEGER', nullable: true, desc: 'Rang dans la classe' },
      { col: 'appreciation', type: 'TEXT', nullable: true, desc: 'Appréciation du conseil de classe' },
    ],
    example: "SELECT appreciation, COUNT(*) AS nb\nFROM bulletins\nGROUP BY appreciation\nORDER BY nb DESC;",
  },
];

const ER_DIAGRAM = `
pays (1) ──── (N) villes (1) ──── (N) ecoles
                                      │
                    ┌─────────────────┤
                    │                 │
                 classes ◄── annees_scolaires
                    │   ◄── niveaux
                    │
    ┌───────────────┼──────────────┐
    │               │              │
enseignements  inscriptions  evaluations ◄── matieres
(enseignant ×  (eleve × an)       │
 classe × mat)                  notes ──► eleves
                                  │
                              absences
                              bulletins
`.trim();

export default function Schema() {
  return (
    <div className="page schema-page">
      <div className="page-header">
        <h1>📐 Schéma de la base de données</h1>
        <p>
          La base <strong>school_db</strong> modélise un système scolaire multi-pays
          avec 15 tables couvrant les établissements, les élèves, les évaluations et les résultats.
        </p>
      </div>

      {/* Overview table */}
      <section className="section">
        <h2>Vue d'ensemble</h2>
        <div className="overview-table-wrap">
          <table className="overview-table">
            <thead>
              <tr>
                <th>#</th><th>Table</th><th>Rôle</th><th>Lignes (prod.)</th>
              </tr>
            </thead>
            <tbody>
              {TABLES_DOC.map((t, i) => (
                <tr key={t.name}>
                  <td>{i + 1}</td>
                  <td><a href={`#table-${t.name}`}><code>{t.name}</code></a></td>
                  <td>{t.desc}</td>
                  <td>{t.columns.length > 0 ? (TABLES_DOC.find(x => x.name === t.name)?.rows || '–') : '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ER Diagram */}
      <section className="section">
        <h2>Diagramme des relations</h2>
        <pre className="er-diagram">{ER_DIAGRAM}</pre>
        <p className="diagram-legend">
          <code>(1) ──── (N)</code> : une ligne d'un côté correspond à plusieurs de l'autre &nbsp;|&nbsp;
          <code>◄──</code> : référence une clé étrangère
        </p>
      </section>

      {/* Per-table docs */}
      {TABLES_DOC.map((t) => (
        <section key={t.name} id={`table-${t.name}`} className="section table-doc">
          <h2>{t.icon} <code>{t.name}</code></h2>
          <p className="table-doc-desc">{t.desc}</p>

          <div className="table-doc-cols">
            <table className="col-table">
              <thead>
                <tr>
                  <th>Colonne</th><th>Type</th><th>Nullable</th><th>Description</th>
                </tr>
              </thead>
              <tbody>
                {t.columns.map((c) => (
                  <tr key={c.col}>
                    <td>
                      <code>{c.col}</code>
                      {c.pk && <span className="pk-badge">PK</span>}
                    </td>
                    <td><span className="type-badge">{c.type}</span></td>
                    <td>{c.nullable ? '✓' : '✗'}</td>
                    <td>{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-example">
            <strong>Exemple :</strong>
            <pre><code>{t.example}</code></pre>
          </div>
        </section>
      ))}

      {/* Views */}
      <section className="section">
        <h2>🔭 Vues SQL</h2>
        <div className="view-doc">
          <h3><code>v_moyennes_eleves</code></h3>
          <p>Calcule la <strong>moyenne de chaque élève par matière et année scolaire</strong>, pondérée par les coefficients des évaluations.</p>
          <pre><code>SELECT * FROM v_moyennes_eleves LIMIT 10;</code></pre>
        </div>
        <div className="view-doc">
          <h3><code>v_classement_classe</code></h3>
          <p>Affiche le <strong>classement des élèves par classe et trimestre</strong> avec rang et appréciation.</p>
          <pre><code>SELECT * FROM v_classement_classe LIMIT 10;</code></pre>
        </div>
      </section>
    </div>
  );
}

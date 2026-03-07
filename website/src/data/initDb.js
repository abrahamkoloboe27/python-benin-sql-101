/**
 * Génération des données d'exemple pour la base de données SQLite
 * Reproduit le schéma du système scolaire avec un jeu de données réduit.
 */

function seededRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function q(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function getInitSQL() {
  const rand = seededRand(42);
  const ri = (max) => Math.floor(rand() * max);
  const pick = (arr) => arr[ri(arr.length)];

  // ─── TABLES ──────────────────────────────────────────────────────────────
  const schema = `
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS bulletins;
DROP TABLE IF EXISTS absences;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS enseignements;
DROP TABLE IF EXISTS inscriptions;
DROP TABLE IF EXISTS eleves;
DROP TABLE IF EXISTS enseignants;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS matieres;
DROP TABLE IF EXISTS niveaux;
DROP TABLE IF EXISTS annees_scolaires;
DROP TABLE IF EXISTS ecoles;
DROP TABLE IF EXISTS villes;
DROP TABLE IF EXISTS pays;

CREATE TABLE pays (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  code_iso TEXT NOT NULL UNIQUE,
  continent TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE villes (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL,
  pays_id INTEGER NOT NULL REFERENCES pays(id),
  code_postal TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE ecoles (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL,
  adresse TEXT,
  ville_id INTEGER NOT NULL REFERENCES villes(id),
  type_ecole TEXT NOT NULL CHECK(type_ecole IN ('public','prive','communautaire')),
  niveau_ecole TEXT NOT NULL CHECK(niveau_ecole IN ('primaire','college','lycee','mixte')),
  telephone TEXT,
  email TEXT,
  directeur TEXT,
  date_creation TEXT,
  capacite_max INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE annees_scolaires (
  id INTEGER PRIMARY KEY,
  libelle TEXT NOT NULL UNIQUE,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  est_active INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE niveaux (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  ordre INTEGER NOT NULL UNIQUE,
  cycle TEXT NOT NULL CHECK(cycle IN ('primaire','college','lycee')),
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE matieres (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  coefficient REAL NOT NULL DEFAULT 1.0,
  cycle TEXT CHECK(cycle IN ('primaire','college','lycee','tous')),
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE enseignants (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT UNIQUE,
  telephone TEXT,
  genre TEXT CHECK(genre IN ('M','F')),
  date_naissance TEXT,
  date_embauche TEXT,
  specialite TEXT,
  ecole_id INTEGER REFERENCES ecoles(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL,
  ecole_id INTEGER NOT NULL REFERENCES ecoles(id),
  niveau_id INTEGER NOT NULL REFERENCES niveaux(id),
  annee_scolaire_id INTEGER NOT NULL REFERENCES annees_scolaires(id),
  effectif_max INTEGER NOT NULL DEFAULT 40,
  salle TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE eleves (
  id INTEGER PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance TEXT NOT NULL,
  genre TEXT NOT NULL CHECK(genre IN ('M','F')),
  adresse TEXT,
  ville_id INTEGER REFERENCES villes(id),
  email_parent TEXT,
  telephone_parent TEXT,
  nom_parent TEXT,
  date_inscription TEXT NOT NULL,
  nationalite TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE inscriptions (
  id INTEGER PRIMARY KEY,
  eleve_id INTEGER NOT NULL REFERENCES eleves(id),
  classe_id INTEGER NOT NULL REFERENCES classes(id),
  annee_scolaire_id INTEGER NOT NULL REFERENCES annees_scolaires(id),
  date_inscription TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'actif'
    CHECK(statut IN ('actif','transfere','abandonne','diplome','redoublant')),
  motif_sortie TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE evaluations (
  id INTEGER PRIMARY KEY,
  titre TEXT NOT NULL,
  matiere_id INTEGER NOT NULL REFERENCES matieres(id),
  classe_id INTEGER NOT NULL REFERENCES classes(id),
  annee_scolaire_id INTEGER NOT NULL REFERENCES annees_scolaires(id),
  type_evaluation TEXT NOT NULL CHECK(type_evaluation IN ('devoir','composition','examen','interrogation')),
  trimestre INTEGER NOT NULL CHECK(trimestre IN (1,2,3)),
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  note_max REAL NOT NULL DEFAULT 20.0,
  coefficient REAL NOT NULL DEFAULT 1.0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  evaluation_id INTEGER NOT NULL REFERENCES evaluations(id),
  eleve_id INTEGER NOT NULL REFERENCES eleves(id),
  note REAL NOT NULL CHECK(note >= 0),
  observation TEXT,
  date_saisie TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(evaluation_id, eleve_id)
);

CREATE TABLE absences (
  id INTEGER PRIMARY KEY,
  eleve_id INTEGER NOT NULL REFERENCES eleves(id),
  classe_id INTEGER NOT NULL REFERENCES classes(id),
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  motif TEXT,
  justifiee INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE bulletins (
  id INTEGER PRIMARY KEY,
  eleve_id INTEGER NOT NULL REFERENCES eleves(id),
  classe_id INTEGER NOT NULL REFERENCES classes(id),
  annee_scolaire_id INTEGER NOT NULL REFERENCES annees_scolaires(id),
  trimestre INTEGER NOT NULL CHECK(trimestre IN (1,2,3)),
  moyenne_generale REAL CHECK(moyenne_generale >= 0 AND moyenne_generale <= 20),
  rang INTEGER,
  appreciation TEXT,
  date_emission TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(eleve_id, annee_scolaire_id, trimestre)
);

CREATE TABLE enseignements (
  id INTEGER PRIMARY KEY,
  enseignant_id INTEGER NOT NULL REFERENCES enseignants(id),
  classe_id INTEGER NOT NULL REFERENCES classes(id),
  matiere_id INTEGER NOT NULL REFERENCES matieres(id),
  heures_hebdo REAL DEFAULT 2.0,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(enseignant_id, classe_id, matiere_id)
);

CREATE VIEW v_moyennes_eleves AS
SELECT
  e.id AS eleve_id,
  e.nom AS eleve_nom,
  e.prenom AS eleve_prenom,
  m.nom AS matiere,
  m.coefficient AS coefficient_matiere,
  a.libelle AS annee_scolaire,
  i.classe_id,
  c.nom AS classe_nom,
  ROUND(SUM(n.note * ev.coefficient) / SUM(ev.coefficient), 2) AS moyenne_matiere
FROM notes n
JOIN evaluations ev ON ev.id = n.evaluation_id
JOIN matieres m ON m.id = ev.matiere_id
JOIN eleves e ON e.id = n.eleve_id
JOIN inscriptions i ON i.eleve_id = e.id AND i.annee_scolaire_id = ev.annee_scolaire_id
JOIN classes c ON c.id = i.classe_id
JOIN annees_scolaires a ON a.id = ev.annee_scolaire_id
GROUP BY e.id, e.nom, e.prenom, m.nom, m.coefficient, a.libelle, i.classe_id, c.nom;

CREATE VIEW v_classement_classe AS
SELECT
  b.classe_id,
  c.nom AS classe_nom,
  a.libelle AS annee_scolaire,
  b.trimestre,
  e.id AS eleve_id,
  e.nom AS eleve_nom,
  e.prenom AS eleve_prenom,
  b.moyenne_generale,
  b.rang,
  b.appreciation
FROM bulletins b
JOIN eleves e ON e.id = b.eleve_id
JOIN classes c ON c.id = b.classe_id
JOIN annees_scolaires a ON a.id = b.annee_scolaire_id
ORDER BY a.libelle, b.classe_id, b.trimestre, b.rang;
`;

  // ─── REFERENCE DATA ──────────────────────────────────────────────────────
  const pays = [
    [1, 'Bénin', 'BJ', 'Afrique'],
    [2, 'France', 'FR', 'Europe'],
    [3, 'Sénégal', 'SN', 'Afrique'],
  ];

  const villes = [
    [1, 'Cotonou', 1, null],
    [2, 'Porto-Novo', 1, null],
    [3, 'Parakou', 1, null],
    [4, 'Abomey-Calavi', 1, null],
    [5, 'Paris', 2, '75001'],
    [6, 'Lyon', 2, '69001'],
    [7, 'Marseille', 2, '13001'],
    [8, 'Bordeaux', 2, '33000'],
    [9, 'Dakar', 3, null],
    [10, 'Saint-Louis', 3, null],
    [11, 'Thiès', 3, null],
    [12, 'Ziguinchor', 3, null],
  ];

  const ecoles = [
    [1, 'École Primaire les Étoiles', 'Av. de la Liberté', 1, 'public', 'primaire', '+229 21 00 01', 'etoiles@edu.bj', 'Koffi Adande', '2005-09-01', 350],
    [2, 'Collège Monseigneur Steinmetz', 'Rue du Lac', 1, 'prive', 'college', '+229 21 00 02', 'cms@edu.bj', 'Félicité Hounsou', '1998-10-01', 600],
    [3, 'Lycée Béhanzin', 'Bd Saint-Michel', 2, 'public', 'lycee', '+229 20 21 03', 'behanzin@edu.bj', 'Aristide Dossou', '1985-09-01', 800],
    [4, 'École Communautaire du Nord', 'Quartier Zongo', 3, 'communautaire', 'primaire', null, null, 'Moussa Inoussa', '2010-01-15', 200],
    [5, 'Collège Mixte de Parakou', 'Av. de l\'Indépendance', 3, 'public', 'mixte', '+229 23 10 50', 'parakou@edu.bj', 'Rachida Tidjani', '2001-09-01', 500],
    [6, 'Lycée Technique de Dakar', 'Bd de la République', 9, 'public', 'lycee', '+221 33 00 01', 'ltd@edu.sn', 'Ousmane Diallo', '1975-09-01', 900],
    [7, 'École Primaire Voltaire', '12 Rue Voltaire', 5, 'prive', 'primaire', '+33 1 40 00 01', 'voltaire@edu.fr', 'Sophie Martin', '1962-09-01', 300],
    [8, 'Collège Jean Moulin', 'Place du Général', 6, 'public', 'college', '+33 4 72 00 01', 'jmoulin@edu.fr', 'Pierre Durand', '1980-09-01', 550],
  ];

  const annees_scolaires = [
    [1, '2019-2020', '2019-09-01', '2020-07-10', 0],
    [2, '2020-2021', '2020-09-01', '2021-07-10', 0],
    [3, '2021-2022', '2021-09-01', '2022-07-10', 0],
    [4, '2022-2023', '2022-09-01', '2023-07-10', 0],
    [5, '2023-2024', '2023-09-01', '2024-07-10', 0],
    [6, '2024-2025', '2024-09-01', '2025-07-10', 1],
  ];

  const niveaux = [
    [1, 'CP',    1,  'primaire', 'Cours Préparatoire'],
    [2, 'CE1',   2,  'primaire', 'Cours Élémentaire 1'],
    [3, 'CE2',   3,  'primaire', 'Cours Élémentaire 2'],
    [4, 'CM1',   4,  'primaire', 'Cours Moyen 1'],
    [5, 'CM2',   5,  'primaire', 'Cours Moyen 2'],
    [6, '6ème',  6,  'college',  'Sixième'],
    [7, '5ème',  7,  'college',  'Cinquième'],
    [8, '4ème',  8,  'college',  'Quatrième'],
    [9, '3ème',  9,  'college',  'Troisième'],
    [10, '2nde', 10, 'lycee',    'Seconde'],
    [11, '1ère', 11, 'lycee',    'Première'],
    [12, 'Tle',  12, 'lycee',    'Terminale'],
  ];

  const matieres = [
    [1,  'Mathématiques',        'MATH', 4.0, 'tous',     'Algèbre, géométrie, analyse'],
    [2,  'Français',             'FR',   4.0, 'tous',     'Langue française, littérature'],
    [3,  'Histoire-Géographie',  'HG',   2.0, 'tous',     'Histoire, géographie, éducation civique'],
    [4,  'Sciences',             'SCI',  2.0, 'primaire', 'Sciences naturelles'],
    [5,  'Anglais',              'ANG',  2.0, 'college',  'Langue anglaise'],
    [6,  'Physique-Chimie',      'PC',   3.0, 'college',  'Physique et chimie'],
    [7,  'SVT',                  'SVT',  2.0, 'college',  'Sciences de la vie et de la Terre'],
    [8,  'Informatique',         'INFO', 1.0, 'lycee',    'Informatique et numérique'],
    [9,  'EPS',                  'EPS',  1.0, 'tous',     'Éducation physique et sportive'],
    [10, 'Arts Plastiques',      'ART',  1.0, 'tous',     'Arts visuels et plastiques'],
    [11, 'Philosophie',          'PHILO',2.0, 'lycee',    'Philosophie'],
    [12, 'Économie',             'ECO',  2.0, 'lycee',    'Économie et gestion'],
  ];

  // ─── ENSEIGNANTS ─────────────────────────────────────────────────────────
  const prenomsMasc = ['Koffi','Aristide','Moussa','Jean','Pierre','Ousmane','Félix','Alain','Didier','Serge','Bruno','Clément','Éric','Farouk','Guy'];
  const prenomsF    = ['Félicité','Rachida','Sophie','Marie','Aline','Fatou','Aminata','Céline','Denise','Élodie','Flore','Grace','Hawa','Irène','Julie'];
  const noms        = ['Adande','Hounsou','Dossou','Inoussa','Tidjani','Diallo','Martin','Durand','Kone','Sawadogo','Bah','Diop','Traoré','Coulibaly','Touré','Sow','Ba','Fall','Sy','Ndiaye'];

  const enseignants = [];
  for (let i = 1; i <= 20; i++) {
    const genre = i % 2 === 0 ? 'F' : 'M';
    const prenom = genre === 'M' ? prenomsMasc[(i - 1) % prenomsMasc.length] : prenomsF[(i - 1) % prenomsF.length];
    const nom = noms[(i - 1) % noms.length];
    const birthYear = 1965 + ri(20);
    const hireYear  = 2000 + ri(24);
    const ecole_id  = (i % 8) + 1;
    const mat = matieres[(i - 1) % matieres.length];
    enseignants.push([
      i,
      nom,
      prenom,
      `${prenom.toLowerCase().replace(/[^a-z]/g,'')}.${nom.toLowerCase().replace(/[^a-z]/g,'')}${i}@school.edu`,
      null,
      genre,
      `${birthYear}-${String(ri(12) + 1).padStart(2,'0')}-${String(ri(28) + 1).padStart(2,'0')}`,
      `${hireYear}-09-01`,
      mat[1],
      ecole_id,
    ]);
  }

  // ─── CLASSES ─────────────────────────────────────────────────────────────
  // 6 classes per school for the active year (2024-2025), level varies
  const classes = [];
  let cid = 1;
  // Active year classes (2024-2025 = annee_id 6)
  const ecoleNiveaux = {
    1: [1,2,3,4,5],       // primaire
    2: [6,7,8,9],         // college
    3: [10,11,12],        // lycee
    4: [1,2,3],           // primaire communautaire
    5: [6,7,8,9,10,11,12],// mixte
    6: [10,11,12],        // lycee Dakar
    7: [1,2,3,4,5],       // primaire Paris
    8: [6,7,8,9],         // college Lyon
  };
  for (const [eid_str, niveauIds] of Object.entries(ecoleNiveaux)) {
    const eid = parseInt(eid_str);
    for (const nid of niveauIds) {
      const nom_niv = niveaux.find(n => n[0] === nid)[1];
      // 2 sections per niveau per year
      for (const lettre of ['A','B']) {
        classes.push([cid++, `${nom_niv} ${lettre}`, eid, nid, 6, 35 + ri(10), `S${String(cid % 20).padStart(2,'0')}`]);
      }
    }
  }
  // Also add classes for 2023-2024 (annee_id 5) for progression exercises
  const classesPrevYear = [];
  for (const [eid_str, niveauIds] of Object.entries(ecoleNiveaux)) {
    const eid = parseInt(eid_str);
    for (const nid of niveauIds) {
      const nom_niv = niveaux.find(n => n[0] === nid)[1];
      for (const lettre of ['A','B']) {
        classes.push([cid++, `${nom_niv} ${lettre}`, eid, nid, 5, 35 + ri(10), `S${String(cid % 20).padStart(2,'0')}`]);
        classesPrevYear.push(cid - 1);
      }
    }
  }

  // ─── ÉLÈVES ──────────────────────────────────────────────────────────────
  const nationalites = ['Béninoise','Béninoise','Béninoise','Sénégalaise','Française','Togolaise','Ivoirienne','Malienne','Camerounaise','Burkinabè'];
  const nomsFamille  = ['Agossou','Ahouansou','Akakpo','Allognon','Amoussouga','Assogba','Attigon','Azonhiho','Bello','Boukari','Chaabi','Dansou','Degbey','Djossou','Dossoumou','Fanfan','Gangbe','Gnimagnon','Gomez','Houessou','Idossou','Kakpo','Katchikpe','Loko','Lokossou','Maxime','Messan','Montcho','Noudohoun','Ohouochi','Peke','Quenum','Sagbo','Sossou','Tossou','Vigan','Waba','Yabi','Zakari','Zinsou'];
  const prenomsMF    = ['Adjoua','Aissatou','Aklesso','Alphonse','Amadou','Amédée','Anastasie','André','Angélique','Aristide','Armand','Assanatou','Ayélé','Barnabé','Bénédicte','Berthe','Brice','Cécile','Chantal','Christian','Christiane','Claire','Clémence','Clovis','Coffi','Constant','Damien','David','Délali','Désiré','Diane','Elias','Emile','Emmanuel','Eugène','Evariste','Fernand','Fidèle','Flore','François','Françoise','Gabriel','Georges','Gervais','Ginette','Guillaume','Hervé','Hubert','Ignace','Irène','Jacques','Jean','Joëlle','Joseph','Julie','Justine','Kevin','Landry','Laurent','Léonce','Lionel','Louis','Lucie','Marc','Marcel','Marie','Marthe','Mathieu','Mélanie','Michel','Moïse','Narcisse','Nicolas','Noël','Odette','Olivia','Pascal','Patrice','Paul','Pauline','Philippe','Pierre','Pulchérie','Raoul','René','Roland','Rosalie','Rosine','Samuel','Séraphin','Simone','Solange','Sylvain','Sylvie','Théodore','Théophile','Thomas','Véronique','Victorine','Wilfried','Xavier','Yvette','Zacharie'];

  const eleves = [];
  for (let i = 1; i <= 150; i++) {
    const genre = rand() > 0.48 ? 'M' : 'F';
    const prenom = prenomsMF[ri(prenomsMF.length)];
    const nom = nomsFamille[ri(nomsFamille.length)];
    const birthYear = 2006 + ri(8);
    const ville_id = rand() < 0.1 ? null : (ri(12) + 1);
    const nationalite = nationalites[ri(nationalites.length)];
    eleves.push([
      i, nom, prenom,
      `${birthYear}-${String(ri(12)+1).padStart(2,'0')}-${String(ri(28)+1).padStart(2,'0')}`,
      genre,
      `${ri(100)+1} Rue des Écoles`,
      ville_id,
      `parent${i}@gmail.com`,
      `+229 97 ${String(ri(90)+10)} ${String(ri(90)+10)} ${String(ri(90)+10)}`,
      `Parent de ${prenom} ${nom}`,
      '2019-09-01',
      nationalite,
    ]);
  }

  // ─── INSCRIPTIONS ─────────────────────────────────────────────────────────
  // Assign ~120 students to active year classes
  const activeClasses = classes.filter(c => c[4] === 6).map(c => c[0]);
  const inscriptions = [];
  let iid = 1;
  const studentClassMap = {}; // eleve_id -> classe_id (for active year)
  for (let sid = 1; sid <= 120; sid++) {
    const cls_id = activeClasses[ri(activeClasses.length)];
    studentClassMap[sid] = cls_id;
    inscriptions.push([iid++, sid, cls_id, 6, '2024-09-01', 'actif', null]);
  }
  // Also enroll 60 students in previous year
  const prevClasses = classes.filter(c => c[4] === 5).map(c => c[0]);
  for (let sid = 1; sid <= 60; sid++) {
    const cls_id = prevClasses[ri(prevClasses.length)];
    inscriptions.push([iid++, sid, cls_id, 5, '2023-09-01', 'actif', null]);
  }

  // ─── ÉVALUATIONS ─────────────────────────────────────────────────────────
  const evalTypes = ['devoir','composition','examen','interrogation'];
  const evaluations = [];
  let eid = 1;
  // Create evaluations for active year classes (subset of 20 classes)
  const classesForEvals = activeClasses.slice(0, 20);
  for (const cls_id of classesForEvals) {
    const cls = classes.find(c => c[0] === cls_id);
    const ecole_id = cls[2];
    const ecoleData = ecoles.find(e => e[0] === ecole_id);
    const cycle = ecoleData[4] === 'primaire' ? 'primaire' : (ecoleData[4] === 'college' ? 'college' : 'lycee');
    const matsForCycle = matieres.filter(m => m[4] === 'tous' || m[4] === cycle);
    // Pick 3 subjects per class
    const selectedMats = matsForCycle.slice(0, Math.min(3, matsForCycle.length));
    for (const mat of selectedMats) {
      for (let t = 1; t <= 3; t++) {
        const type = evalTypes[ri(evalTypes.length)];
        const month = t === 1 ? 11 : t === 2 ? 2 : 5;
        const day = ri(20) + 1;
        const date = `2024-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        evaluations.push([
          eid++,
          `${mat[1]} – ${type.charAt(0).toUpperCase()+type.slice(1)} T${t}`,
          mat[0], cls_id, 6,
          type, t, date, null,
          20.0, t === 2 ? 2.0 : 1.0,
        ]);
      }
    }
  }

  // ─── NOTES ───────────────────────────────────────────────────────────────
  const observations = [null, null, 'Très bien.', 'Bon travail.', 'Peut mieux faire.', 'Efforts à poursuivre.', 'Excellent.', 'Insuffisant.', 'Bien.', 'Passable.'];
  const notes = [];
  let nid = 1;
  for (const ev of evaluations) {
    const evId = ev[0];
    const clsId = ev[3];
    // Find students enrolled in this class
    const students = inscriptions.filter(i => i[2] === clsId && i[3] === 6).map(i => i[1]);
    for (const sid of students) {
      // Generate a note with some distribution: talent affects note
      const talent = (sid % 5) / 4; // 0 to 1
      const base = 8 + talent * 10;
      let note = Math.min(20, Math.max(0, parseFloat((base + (rand() - 0.5) * 8).toFixed(2))));
      // Force some 20/20 notes
      if (rand() < 0.03) note = 20;
      // Some notes between 14-16
      if (rand() < 0.05) note = parseFloat((14 + rand() * 2).toFixed(2));
      const obs = pick(observations);
      const month = ev[7].split('-')[1];
      notes.push([nid++, evId, sid, note, obs, `2024-${month}-${String(ri(28)+1).padStart(2,'0')}`]);
    }
  }

  // ─── ABSENCES ────────────────────────────────────────────────────────────
  const motifs = [null, 'Maladie', 'Maladie', 'Voyage', 'Deuil familial', 'Problème de transport', null, 'Maladie', 'Cérémonie', null];
  const absences = [];
  let abid = 1;
  for (let i = 0; i < 100; i++) {
    const sid = ri(120) + 1;
    const cls_id = studentClassMap[sid] || activeClasses[0];
    const month = ri(9) + 1;
    const day = ri(20) + 1;
    const date_debut = `2024-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const duree = ri(3) + 1;
    const day2 = Math.min(day + duree, 28);
    const date_fin = `2024-${String(month).padStart(2,'0')}-${String(day2).padStart(2,'0')}`;
    const motif = pick(motifs);
    const justifiee = motif !== null ? (rand() > 0.4 ? 1 : 0) : 0;
    absences.push([abid++, sid, cls_id, date_debut, date_fin, motif, justifiee]);
  }

  // ─── BULLETINS ───────────────────────────────────────────────────────────
  const appreciations = ['Très bien','Bien','Assez bien','Passable','Insuffisant'];
  const bulletins = [];
  let bid = 1;
  const studentsPerClass = {};
  for (const insc of inscriptions) {
    if (insc[3] === 6) {
      if (!studentsPerClass[insc[2]]) studentsPerClass[insc[2]] = [];
      studentsPerClass[insc[2]].push(insc[1]);
    }
  }
  for (const [cls_id_str, students] of Object.entries(studentsPerClass)) {
    const cls_id = parseInt(cls_id_str);
    for (let t = 1; t <= 3; t++) {
      // Compute ranking within class/trimester
      const classGrades = students.map(sid => {
        const talent = (sid % 5) / 4;
        const moy = parseFloat((8 + talent * 10 + (rand() - 0.5) * 3).toFixed(2));
        return { sid, moy: Math.min(20, Math.max(0, moy)) };
      });
      classGrades.sort((a, b) => b.moy - a.moy);
      classGrades.forEach(({ sid, moy }, idx) => {
        const appIdx = moy >= 16 ? 0 : moy >= 14 ? 1 : moy >= 12 ? 2 : moy >= 10 ? 3 : 4;
        bulletins.push([bid++, sid, cls_id, 6, t, moy, idx + 1, appreciations[appIdx], `2024-${String(t * 4).padStart(2,'0')}-15`]);
      });
    }
  }

  // Also add prev-year bulletins for some students
  const prevStudentClasses = {};
  for (const insc of inscriptions) {
    if (insc[3] === 5) {
      prevStudentClasses[insc[1]] = insc[2];
    }
  }
  for (const [sid_str, cls_id] of Object.entries(prevStudentClasses)) {
    const sid = parseInt(sid_str);
    for (let t = 1; t <= 3; t++) {
      const talent = (sid % 5) / 4;
      const moy = Math.min(20, Math.max(0, parseFloat((7 + talent * 11 + (rand() - 0.5) * 3).toFixed(2))));
      const appIdx = moy >= 16 ? 0 : moy >= 14 ? 1 : moy >= 12 ? 2 : moy >= 10 ? 3 : 4;
      bulletins.push([bid++, sid, cls_id, 5, t, moy, 1, appreciations[appIdx], `2023-${String(t * 4).padStart(2,'0')}-15`]);
    }
  }

  // ─── ENSEIGNEMENTS ───────────────────────────────────────────────────────
  const enseignements = [];
  let egid = 1;
  for (const ev of evaluations.slice(0, 50)) {
    const mat_id = ev[2];
    const cls_id = ev[3];
    const ens = enseignants[ri(enseignants.length)];
    // Avoid duplicates
    if (!enseignements.find(e => e[1] === ens[0] && e[2] === cls_id && e[3] === mat_id)) {
      enseignements.push([egid++, ens[0], cls_id, mat_id, 2 + ri(3)]);
    }
  }

  // ─── BUILD INSERT STATEMENTS ──────────────────────────────────────────────
  // Use explicit column names to avoid mismatch with DEFAULT columns (e.g. created_at).
  function inserts(table, cols, rows) {
    const colList = cols.join(', ');
    return rows.map(row => `INSERT INTO ${table} (${colList}) VALUES (${row.map(q).join(', ')});`).join('\n');
  }

  return [
    schema,
    inserts('pays',             ['id','nom','code_iso','continent'], pays),
    inserts('villes',           ['id','nom','pays_id','code_postal'], villes),
    inserts('ecoles',           ['id','nom','adresse','ville_id','type_ecole','niveau_ecole','telephone','email','directeur','date_creation','capacite_max'], ecoles),
    inserts('annees_scolaires', ['id','libelle','date_debut','date_fin','est_active'], annees_scolaires),
    inserts('niveaux',          ['id','nom','ordre','cycle','description'], niveaux),
    inserts('matieres',         ['id','nom','code','coefficient','cycle','description'], matieres),
    inserts('enseignants',      ['id','nom','prenom','email','telephone','genre','date_naissance','date_embauche','specialite','ecole_id'], enseignants),
    inserts('classes',          ['id','nom','ecole_id','niveau_id','annee_scolaire_id','effectif_max','salle'], classes),
    inserts('eleves',           ['id','nom','prenom','date_naissance','genre','adresse','ville_id','email_parent','telephone_parent','nom_parent','date_inscription','nationalite'], eleves),
    inserts('inscriptions',     ['id','eleve_id','classe_id','annee_scolaire_id','date_inscription','statut','motif_sortie'], inscriptions),
    inserts('evaluations',      ['id','titre','matiere_id','classe_id','annee_scolaire_id','type_evaluation','trimestre','date_debut','date_fin','note_max','coefficient'], evaluations),
    inserts('notes',            ['id','evaluation_id','eleve_id','note','observation','date_saisie'], notes),
    inserts('absences',         ['id','eleve_id','classe_id','date_debut','date_fin','motif','justifiee'], absences),
    inserts('bulletins',        ['id','eleve_id','classe_id','annee_scolaire_id','trimestre','moyenne_generale','rang','appreciation','date_emission'], bulletins),
    inserts('enseignements',    ['id','enseignant_id','classe_id','matiere_id','heures_hebdo'], enseignements),
  ].join('\n');
}

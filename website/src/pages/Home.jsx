import { Link } from 'react-router-dom';

const TABLES = [
  { icon: '🌍', name: 'pays', rows: '3', desc: 'Référentiel des pays (Bénin, France, Sénégal)' },
  { icon: '🏙️', name: 'villes', rows: '12', desc: 'Villes rattachées à un pays' },
  { icon: '🏫', name: 'ecoles', rows: '~24', desc: 'Établissements scolaires (public, privé, communautaire)' },
  { icon: '📅', name: 'annees_scolaires', rows: '6', desc: 'Années scolaires 2019–2025' },
  { icon: '📚', name: 'niveaux', rows: '12', desc: 'Niveaux CP → Terminale' },
  { icon: '📐', name: 'matieres', rows: '12', desc: 'Matières enseignées avec coefficients' },
  { icon: '👨‍🏫', name: 'enseignants', rows: '~280', desc: 'Corps enseignant des établissements' },
  { icon: '🏛️', name: 'classes', rows: '~1 300', desc: 'Classes par école, niveau et année scolaire' },
  { icon: '👨‍🎓', name: 'eleves', rows: '~5 500', desc: 'Élèves inscrits dans le système' },
  { icon: '📋', name: 'inscriptions', rows: '~26 000', desc: 'Parcours scolaire annuel de chaque élève' },
  { icon: '✏️', name: 'evaluations', rows: '~50 000', desc: 'Devoirs, compositions, examens, interrogations' },
  { icon: '🔢', name: 'notes', rows: '~1 200 000', desc: 'Notes sur 20 par élève et évaluation' },
  { icon: '🚪', name: 'absences', rows: '~16 000', desc: 'Absences justifiées ou non' },
  { icon: '📊', name: 'bulletins', rows: '~80 000', desc: 'Bulletins trimestriels avec rang et appréciation' },
];

export default function Home() {
  return (
    <div className="page home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🇧🇯 Python Bénin</div>
          <h1>SQL 101 — Apprendre SQL par la pratique</h1>
          <p className="hero-sub">
            Explorez une vraie base de données scolaire, lisez la documentation, et
            entraînez-vous directement dans votre navigateur — sans rien installer.
          </p>
          <div className="hero-actions">
            <Link to="/exercises" className="btn-primary">
              ▶ Commencer les exercices
            </Link>
            <Link to="/schema" className="btn-secondary">
              📐 Voir le schéma
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <span className="feature-icon">🗄️</span>
          <h3>Base de données réelle</h3>
          <p>Un système scolaire multi-pays avec 15 tables, des millions de lignes et des relations complexes.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚡</span>
          <h3>Requêtes en direct</h3>
          <p>Tapez vos requêtes SQL et obtenez les résultats instantanément dans votre navigateur.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📈</span>
          <h3>30 exercices progressifs</h3>
          <p>Du SELECT simple aux fonctions fenêtres avancées — 3 niveaux de difficulté.</p>
        </div>
      </section>

      {/* Tables overview */}
      <section className="section">
        <h2>La base de données</h2>
        <p className="section-desc">
          La base <strong>school_db</strong> modélise un système scolaire multi-pays (Bénin, France, Sénégal)
          sur 6 années scolaires (2019–2025).
        </p>
        <div className="tables-grid">
          {TABLES.map((t) => (
            <div key={t.name} className="table-card">
              <span className="table-icon">{t.icon}</span>
              <div>
                <code className="table-name">{t.name}</code>
                <span className="table-rows">{t.rows} lignes</span>
                <p className="table-desc">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="section-cta">
          <Link to="/schema" className="btn-secondary">Voir la documentation complète →</Link>
        </div>
      </section>

      {/* Learning path */}
      <section className="section learning-path">
        <h2>Parcours d'apprentissage</h2>
        <div className="path-steps">
          <div className="path-step">
            <div className="step-num">1</div>
            <div>
              <h4>Comprendre le schéma</h4>
              <p>Lisez la documentation des tables pour savoir quelles données sont disponibles.</p>
              <Link to="/schema">Voir le schéma →</Link>
            </div>
          </div>
          <div className="path-step">
            <div className="step-num">2</div>
            <div>
              <h4>🟢 Niveau 1 — Débutant</h4>
              <p>Maîtrisez SELECT, WHERE, ORDER BY, LIMIT et COUNT avec des requêtes simples.</p>
              <Link to="/exercises">Commencer →</Link>
            </div>
          </div>
          <div className="path-step">
            <div className="step-num">3</div>
            <div>
              <h4>🟡 Niveau 2 — Intermédiaire</h4>
              <p>GROUP BY, HAVING, JOIN, LEFT JOIN et fonctions d'agrégation.</p>
              <Link to="/exercises">Continuer →</Link>
            </div>
          </div>
          <div className="path-step">
            <div className="step-num">4</div>
            <div>
              <h4>🔴 Niveau 3 — Avancé</h4>
              <p>Sous-requêtes, CTEs, fonctions fenêtres (RANK, LAG, ROW_NUMBER).</p>
              <Link to="/exercises">Relever le défi →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Note */}
      <section className="section notice-section">
        <div className="notice">
          <strong>ℹ️ Note technique :</strong> L'éditeur SQL intégré utilise{' '}
          <strong>SQLite</strong> (via SQL.js) qui s'exécute entièrement dans votre
          navigateur. La quasi-totalité des requêtes standard SQL fonctionne
          identiquement. Quelques fonctions spécifiques à PostgreSQL sont adaptées
          dans les énoncés (ex. : <code>strftime</code> à la place de <code>AGE()</code>).
        </div>
      </section>
    </div>
  );
}

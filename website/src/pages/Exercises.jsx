import { useState } from 'react';
import { useDatabase } from '../hooks/useDatabase';
import SqlEditor from '../components/SqlEditor';
import { LEVELS, EXERCISES } from '../data/exercises';

export default function Exercises() {
  const { db, loading, error } = useDatabase();
  const [activeLevel, setActiveLevel] = useState(1);
  const [activeExercise, setActiveExercise] = useState(0);
  const [freeQuery, setFreeQuery] = useState('SELECT * FROM eleves LIMIT 10;');

  const exercises = EXERCISES[activeLevel] || [];
  const exercise = exercises[activeExercise];

  const handleLevelChange = (lvl) => {
    setActiveLevel(lvl);
    setActiveExercise(0);
  };

  return (
    <div className="page exercises-page">
      <div className="page-header">
        <h1>🏋️ Exercices SQL</h1>
        <p>Lisez l'énoncé, écrivez votre requête et exécutez-la directement dans votre navigateur.</p>
        {loading && <div className="db-loading">⏳ Chargement de la base de données SQLite…</div>}
        {error && <div className="db-error">❌ Erreur de chargement : {error}</div>}
      </div>

      {/* Level tabs */}
      <div className="level-tabs">
        {LEVELS.map((lvl) => (
          <button
            key={lvl.id}
            className={`level-tab ${activeLevel === lvl.id ? 'active' : ''}`}
            onClick={() => handleLevelChange(lvl.id)}
          >
            {lvl.emoji} {lvl.label}
            <span className="level-sub">{lvl.title}</span>
          </button>
        ))}
        <button
          className={`level-tab ${activeLevel === 0 ? 'active' : ''}`}
          onClick={() => setActiveLevel(0)}
        >
          🔓 Éditeur libre
          <span className="level-sub">Requête libre</span>
        </button>
      </div>

      {/* Free editor mode */}
      {activeLevel === 0 && (
        <div className="free-editor-section">
          <div className="free-editor-header">
            <h2>🔓 Éditeur libre</h2>
            <p>Explorez librement la base de données. Commencez par lister les tables disponibles.</p>
          </div>
          <SqlEditor db={db} initialQuery={freeQuery} key="free" />
          <div className="quick-queries">
            <strong>Requêtes rapides :</strong>
            {[
              { label: 'Tables', q: "SELECT name FROM sqlite_master WHERE type='table';" },
              { label: 'Pays', q: 'SELECT * FROM pays;' },
              { label: 'Écoles', q: 'SELECT * FROM ecoles LIMIT 10;' },
              { label: 'Élèves', q: 'SELECT * FROM eleves LIMIT 10;' },
              { label: 'Notes', q: 'SELECT * FROM notes LIMIT 10;' },
            ].map(({ label, q }) => (
              <button key={label} className="quick-btn" onClick={() => setFreeQuery(q)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercise mode */}
      {activeLevel > 0 && (
        <div className="exercise-layout">
          {/* Sidebar: exercise list */}
          <aside className="exercise-list">
            <div className="exercise-list-header">
              <span>{LEVELS.find(l => l.id === activeLevel)?.emoji} Exercices</span>
              <span className="level-themes">{LEVELS.find(l => l.id === activeLevel)?.themes}</span>
            </div>
            {exercises.map((ex, idx) => (
              <button
                key={ex.id}
                className={`exercise-item ${activeExercise === idx ? 'active' : ''}`}
                onClick={() => setActiveExercise(idx)}
              >
                <span className="ex-num">{ex.id}</span>
                <span className="ex-title">{ex.title}</span>
              </button>
            ))}
          </aside>

          {/* Main: exercise detail + editor */}
          {exercise && (
            <main className="exercise-main">
              <div className="exercise-header">
                <div className="exercise-badge">Exercice {exercise.id} / {exercises.length}</div>
                <h2>{exercise.title}</h2>
              </div>

              <div className="exercise-body">
                <div className="exercise-section">
                  <strong>📋 Énoncé</strong>
                  <p>{exercise.enonce}</p>
                </div>

                {exercise.tables.length > 0 && (
                  <div className="exercise-section">
                    <strong>🗄️ Tables</strong>
                    <div className="table-tags">
                      {exercise.tables.map((t) => (
                        <code key={t} className="table-tag">{t}</code>
                      ))}
                    </div>
                  </div>
                )}

                <details className="exercise-hint">
                  <summary>💡 Voir l'indice</summary>
                  <p>{exercise.indice}</p>
                </details>
              </div>

              <SqlEditor
                db={db}
                initialQuery={exercise.starter}
                key={`${activeLevel}-${activeExercise}`}
              />

              <div className="exercise-nav">
                <button
                  className="btn-nav"
                  onClick={() => setActiveExercise(Math.max(0, activeExercise - 1))}
                  disabled={activeExercise === 0}
                >
                  ← Précédent
                </button>
                <span className="ex-progress">
                  {activeExercise + 1} / {exercises.length}
                </span>
                <button
                  className="btn-nav"
                  onClick={() => setActiveExercise(Math.min(exercises.length - 1, activeExercise + 1))}
                  disabled={activeExercise === exercises.length - 1}
                >
                  Suivant →
                </button>
              </div>
            </main>
          )}
        </div>
      )}
    </div>
  );
}

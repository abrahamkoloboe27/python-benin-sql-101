import { useState, useCallback } from 'react';
import { useAuth } from '../context/useAuth';

const MAX_ROWS = 200;

export default function SqlEditor({ db, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const { user, saveQuery } = useAuth();

  const runQuery = useCallback(() => {
    if (!db || !query.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = db.exec(query);
      const total = res.reduce((s, r) => s + r.values.length, 0);
      setRowCount(total);
      setResults(res.map((r) => ({ ...r, values: r.values.slice(0, MAX_ROWS) })));
      // Persist to history if logged in (fire-and-forget)
      saveQuery(query, total, false);
    } catch (e) {
      setError(e.message);
      saveQuery(query, 0, true);
    } finally {
      setLoading(false);
    }
  }, [db, query, saveQuery]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newVal = query.substring(0, start) + '  ' + query.substring(end);
      setQuery(newVal);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="sql-editor">
      <div className="editor-area">
        <textarea
          className="sql-textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Écrivez votre requête SQL ici…"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className="editor-toolbar">
          <button
            className="btn-run"
            onClick={runQuery}
            disabled={!db || loading || !query.trim()}
            title="Exécuter (Ctrl+Entrée)"
          >
            {loading ? '⏳ Exécution…' : '▶ Exécuter'}
          </button>
          <button
            className="btn-clear"
            onClick={() => { setQuery(''); setResults(null); setError(null); }}
            title="Effacer"
          >
            ✕ Effacer
          </button>
          {!db && <span className="hint">⏳ Chargement de la base…</span>}
          {user && <span className="hint saved-hint">💾 Requêtes sauvegardées</span>}
          <span className="shortcut-hint">Ctrl+Entrée pour exécuter</span>
        </div>
      </div>

      {error && (
        <div className="result-error">
          <strong>❌ Erreur SQL :</strong> {error}
        </div>
      )}

      {results !== null && results.length === 0 && (
        <div className="result-empty">
          ✅ Requête exécutée avec succès — aucune ligne retournée.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="results-wrapper">
          <div className="result-meta">
            {rowCount} ligne{rowCount !== 1 ? 's' : ''} retournée{rowCount !== 1 ? 's' : ''}
            {rowCount >= MAX_ROWS && ` (affichage limité à ${MAX_ROWS})`}
          </div>
          {results.map((result, i) => (
            <div key={i} className="table-scroll">
              <table className="result-table">
                <thead>
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.values.map((row, j) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td key={k}>
                          {cell === null ? (
                            <span className="null-value">NULL</span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


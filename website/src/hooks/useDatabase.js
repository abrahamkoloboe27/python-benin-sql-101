import { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';
import { getInitSQL } from '../data/initDb';

let dbInstance = null;
let initPromise = null;

/**
 * Singleton hook – charge la base SQLite une seule fois et la réutilise.
 */
export function useDatabase() {
  // Initialise directement depuis l'instance déjà en mémoire si disponible
  const [db, setDb] = useState(() => dbInstance);
  const [loading, setLoading] = useState(() => !dbInstance);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Déjà initialisé : l'état a été rempli par l'initialiseur de useState
    if (dbInstance) return;

    if (!initPromise) {
      initPromise = (async () => {
        const SQL = await initSqlJs({
          locateFile: (file) => `${import.meta.env.BASE_URL}${file}`,
        });
        const database = new SQL.Database();
        const sql = getInitSQL();
        database.run(sql);
        dbInstance = database;
        return database;
      })();
    }

    initPromise
      .then((database) => {
        setDb(database);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
        initPromise = null;
      });
  }, []);

  return { db, loading, error };
}

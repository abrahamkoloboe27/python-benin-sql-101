"""
main.py
=======
Point d'entrée du projet school-db-analysis.

Ce script suit un workflow en 3 étapes :
  1. Génération des données factices en mémoire (SchoolDataGenerator).
  2. Sauvegarde des données au format Parquet dans le dossier ``data/``.
  3. Connexion à la base PostgreSQL, création du schéma, puis insertion
     des données depuis les fichiers Parquet.

Utilisation
-----------
    python main.py [--reset] [--date-debut YYYY-MM-DD] [--date-fin YYYY-MM-DD] [--batch-size N]

Options
-------
    --reset          : Supprime et recrée le schéma avant de générer les données
                       (utile pour repartir d'une base vide).
    --date-debut     : Surcharge la variable DATE_DEBUT de generate_data.py.
    --date-fin       : Surcharge la variable DATE_FIN de generate_data.py.
    --batch-size     : Taille des lots d'insert SQL (défaut : 1000).

Prérequis
---------
    - Fichier .env complété (copier .env.example → .env).
    - Base de données PostgreSQL accessible.
    - pip install -r requirements.txt
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date
from pathlib import Path

from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# Chargement du .env situé dans le même répertoire que main.py
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

# Dossier de sauvegarde des fichiers Parquet
DATA_DIR: Path = Path(__file__).parent / "data"


def _get_db_connection():
    """Retourne une connexion psycopg2 en utilisant les variables d'env."""
    import psycopg2

    kwargs: dict = {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", 5432)),
        "dbname": os.getenv("DB_NAME", "school_db"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", ""),
    }

    sslmode = os.getenv("DB_SSLMODE")
    if sslmode:
        kwargs["sslmode"] = sslmode

    return psycopg2.connect(**kwargs)


def apply_schema(reset: bool = False) -> None:
    """
    Applique le fichier schema.sql sur la base de données.

    Paramètres
    ----------
    reset : si True, supprime toutes les tables existantes avant de les recréer
            (DROP TABLE … CASCADE).  Si False, utilise IF NOT EXISTS pour ne
            créer que les tables/index manquants et préserver les données
            existantes.
    """
    schema_path = Path(__file__).parent / "schema.sql"
    if not schema_path.exists():
        print(f"❌ Fichier introuvable : {schema_path}", file=sys.stderr)
        sys.exit(1)

    sql = schema_path.read_text(encoding="utf-8")

    if not reset:
        # Retirer les lignes DROP TABLE pour ne pas écraser les données
        filtered = [
            line for line in sql.splitlines()
            if not line.strip().upper().startswith("DROP TABLE")
        ]
        sql = "\n".join(filtered)

    conn = _get_db_connection()
    conn.autocommit = True
    with conn.cursor() as cur:
        if reset:
            print("→ Suppression et recréation du schéma…")
        else:
            print("→ Application du schéma (sans reset)…")
        cur.execute(sql)
    conn.close()
    print("✅  Schéma appliqué avec succès.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Génère des données factices pour la base de données scolaire."
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Supprime et recrée le schéma avant la génération.",
    )
    parser.add_argument(
        "--date-debut",
        type=lambda s: date.fromisoformat(s),
        default=None,
        metavar="YYYY-MM-DD",
        help="Date de début de la période de génération (défaut : 2019-09-01).",
    )
    parser.add_argument(
        "--date-fin",
        type=lambda s: date.fromisoformat(s),
        default=None,
        metavar="YYYY-MM-DD",
        help="Date de fin de la période de génération (défaut : 2024-07-31).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1000,
        metavar="N",
        help="Taille des lots d'insert SQL (défaut : 1000).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    from generate_data import DATE_DEBUT, DATE_FIN, SchoolDataGenerator, insert_from_parquet

    date_debut = args.date_debut or DATE_DEBUT
    date_fin = args.date_fin or DATE_FIN

    if args.batch_size <= 0:
        raise ValueError("--batch-size doit être un entier strictement positif")

    # ------------------------------------------------------------------
    # Étape 1 – Génération des données en mémoire
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  Étape 1 : Génération des données en mémoire")
    print("=" * 60)
    generator = SchoolDataGenerator(date_debut=date_debut, date_fin=date_fin)
    generator.generate()

    # ------------------------------------------------------------------
    # Étape 2 – Sauvegarde au format Parquet dans data/
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print(f"  Étape 2 : Sauvegarde Parquet → {DATA_DIR}")
    print("=" * 60)
    generator.save_to_parquet(DATA_DIR)

    # ------------------------------------------------------------------
    # Étape 3 – Connexion à la base, création du schéma, insertion
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  Étape 3 : Connexion DB, schéma et insertion des données")
    print("=" * 60)
    apply_schema(reset=args.reset)
    conn = _get_db_connection()
    try:
        insert_from_parquet(DATA_DIR, conn, batch_size=args.batch_size)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
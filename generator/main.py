"""
main.py
=======
Point d'entrée du projet school-db-analysis.

Ce script :
  1. Initialise la base de données en exécutant schema.sql (CREATE TABLE, vues, index).
  2. Lance la génération de données factices via SchoolDataGenerator.

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


def _get_db_connection():
    """Retourne une connexion psycopg2 en utilisant les variables d'env."""
    import psycopg2

    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "school_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )


def apply_schema(reset: bool = False) -> None:
    """
    Applique le fichier schema.sql sur la base de données.

    Paramètres
    ----------
    reset : si True, les DROP TABLE en tête du fichier recreent le schéma.
            Si False, le script est exécuté tel quel (idempotent grâce aux
            IF NOT EXISTS ou à une base vide).
    """
    schema_path = Path(__file__).parent / "schema.sql"
    if not schema_path.exists():
        print(f"❌ Fichier introuvable : {schema_path}", file=sys.stderr)
        sys.exit(1)

    sql = schema_path.read_text(encoding="utf-8")

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

    # Étape 1 – Schéma
    apply_schema(reset=args.reset)

    # Étape 2 – Génération des données
    from generate_data import DATE_DEBUT, DATE_FIN, SchoolDataGenerator

    date_debut = args.date_debut or DATE_DEBUT
    date_fin = args.date_fin or DATE_FIN

    if args.batch_size <= 0:
        raise ValueError("--batch-size doit être un entier strictement positif")
    os.environ["DB_BATCH_SIZE"] = str(args.batch_size)

    generator = SchoolDataGenerator(date_debut=date_debut, date_fin=date_fin)
    generator.run()


if __name__ == "__main__":
    main()

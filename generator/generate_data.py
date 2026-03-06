"""
generate_data.py
================
Génère des données factices cohérentes pour la base de données scolaire
et les insère dans PostgreSQL.

Variables globales de configuration
------------------------------------
    DATE_DEBUT : date de début de la période de génération (première rentrée).
    DATE_FIN   : date de fin de la période de génération (dernière fin d'année).

Utilisation
-----------
    python generate_data.py

Prérequis
---------
    - Un fichier .env à la racine du projet (voir .env.example).
    - La base de données et le schéma créés au préalable :
        psql -U <user> -d <db> -f schema.sql
"""

from __future__ import annotations

import os
import random
import sys
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from faker import Faker
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Chargement des variables d'environnement
# ---------------------------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------------------------
# ██  VARIABLES GLOBALES DE CONFIGURATION  ██
# ---------------------------------------------------------------------------
# Modifiez ces deux dates pour changer la plage temporelle de la génération.
DATE_DEBUT: date = date(2019, 9, 1)   # Première rentrée scolaire
DATE_FIN: date = date(2025, 12, 31)    # Fin de la dernière année scolaire

# Paramètres de volumétrie (ajustables)
NB_PAYS: int = 3
NB_VILLES_PAR_PAYS: int = 4
NB_ECOLES_PAR_VILLE: int = 2
NB_ELEVES_PAR_CLASSE: int = 30        # Effectif moyen par classe
NB_EVALUATIONS_PAR_MATIERE_PAR_TRIM: int = 2  # Devoirs + compositions
TAUX_REDOUBLEMENT: float = 0.08       # 8 % d'élèves redoublent
TAUX_ABANDON: float = 0.02            # 2 % d'élèves abandonnent par an

# ---------------------------------------------------------------------------
# Faker francophone
# ---------------------------------------------------------------------------
fake = Faker("fr_FR")
Faker.seed(42)
random.seed(42)

# ---------------------------------------------------------------------------
# Référentiels statiques
# ---------------------------------------------------------------------------
PAYS_DATA: List[Dict[str, str]] = [
    {"nom": "France",  "code_iso": "FR", "continent": "Europe"},
    {"nom": "Bénin",   "code_iso": "BJ", "continent": "Afrique"},
    {"nom": "Sénégal", "code_iso": "SN", "continent": "Afrique"},
]

NIVEAUX_DATA: List[Dict[str, Any]] = [
    # Primaire
    {"nom": "CP",   "ordre": 1, "cycle": "primaire", "description": "Cours Préparatoire"},
    {"nom": "CE1",  "ordre": 2, "cycle": "primaire", "description": "Cours Élémentaire 1"},
    {"nom": "CE2",  "ordre": 3, "cycle": "primaire", "description": "Cours Élémentaire 2"},
    {"nom": "CM1",  "ordre": 4, "cycle": "primaire", "description": "Cours Moyen 1"},
    {"nom": "CM2",  "ordre": 5, "cycle": "primaire", "description": "Cours Moyen 2"},
    # Collège
    {"nom": "6ème", "ordre": 6,  "cycle": "college", "description": "Sixième"},
    {"nom": "5ème", "ordre": 7,  "cycle": "college", "description": "Cinquième"},
    {"nom": "4ème", "ordre": 8,  "cycle": "college", "description": "Quatrième"},
    {"nom": "3ème", "ordre": 9,  "cycle": "college", "description": "Troisième"},
    # Lycée
    {"nom": "2nde", "ordre": 10, "cycle": "lycee",   "description": "Seconde"},
    {"nom": "1ère", "ordre": 11, "cycle": "lycee",   "description": "Première"},
    {"nom": "Tle",  "ordre": 12, "cycle": "lycee",   "description": "Terminale"},
]

MATIERES_DATA: List[Dict[str, Any]] = [
    {"nom": "Mathématiques",           "code": "MATH", "coefficient": 4.0, "cycle": "tous"},
    {"nom": "Français",                "code": "FR",   "coefficient": 4.0, "cycle": "tous"},
    {"nom": "Histoire-Géographie",     "code": "HG",   "coefficient": 2.0, "cycle": "tous"},
    {"nom": "Sciences de la Vie",      "code": "SVT",  "coefficient": 2.0, "cycle": "college"},
    {"nom": "Physique-Chimie",         "code": "PC",   "coefficient": 3.0, "cycle": "college"},
    {"nom": "Anglais",                 "code": "ANG",  "coefficient": 2.0, "cycle": "tous"},
    {"nom": "Éducation Physique",      "code": "EPS",  "coefficient": 1.0, "cycle": "tous"},
    {"nom": "Arts Plastiques",         "code": "ART",  "coefficient": 1.0, "cycle": "primaire"},
    {"nom": "Informatique",            "code": "INFO", "coefficient": 1.5, "cycle": "lycee"},
    {"nom": "Philosophie",             "code": "PHILO","coefficient": 3.0, "cycle": "lycee"},
    {"nom": "Sciences Économiques",    "code": "ECO",  "coefficient": 3.0, "cycle": "lycee"},
    {"nom": "Éveil Scientifique",      "code": "EVSC", "coefficient": 2.0, "cycle": "primaire"},
]

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _annees_scolaires_entre(debut: date, fin: date) -> List[Tuple[str, date, date]]:
    """Génère la liste des années scolaires comprises entre debut et fin."""
    annees = []
    annee_courante = debut.year
    while True:
        debut_annee = date(annee_courante, 9, 1)
        fin_annee = date(annee_courante + 1, 7, 31)
        if debut_annee > fin:
            break
        if fin_annee < debut:
            annee_courante += 1
            continue
        libelle = f"{annee_courante}-{annee_courante + 1}"
        annees.append((libelle, debut_annee, fin_annee))
        annee_courante += 1
    return annees


def _trimesters(annee_debut: date) -> List[Tuple[int, date, date]]:
    """Retourne les 3 trimestres d'une année scolaire."""
    return [
        (1, annee_debut,                         date(annee_debut.year,     12, 20)),
        (2, date(annee_debut.year + 1, 1,  5),   date(annee_debut.year + 1,  3, 31)),
        (3, date(annee_debut.year + 1, 4,  5),   date(annee_debut.year + 1,  7, 10)),
    ]


def _random_date_between(start: date, end: date) -> date:
    delta = (end - start).days
    if delta <= 0:
        return start
    return start + timedelta(days=random.randint(0, delta))


def _note_aleatoire(niveau_eleve: float = 10.0, ecart: float = 4.0) -> float:
    """Génère une note sur 20 avec une distribution normale centrée sur niveau_eleve."""
    note = random.gauss(niveau_eleve, ecart)
    return round(max(0.0, min(20.0, note)), 2)


def _appreciation(moyenne: float) -> str:
    if moyenne >= 16:
        return "Très bien"
    if moyenne >= 14:
        return "Bien"
    if moyenne >= 12:
        return "Assez bien"
    if moyenne >= 10:
        return "Passable"
    return "Insuffisant"


# ---------------------------------------------------------------------------
# Classe principale de génération
# ---------------------------------------------------------------------------

class SchoolDataGenerator:
    """
    Génère et insère toutes les données factices dans la base PostgreSQL.

    Paramètres
    ----------
    date_debut : date de début de la génération (utilisé pour les années scolaires).
    date_fin   : date de fin de la génération.
    """

    def __init__(self, date_debut: date = DATE_DEBUT, date_fin: date = DATE_FIN) -> None:
        self.date_debut = date_debut
        self.date_fin = date_fin

        # Import ici pour éviter l'import au niveau module si psycopg2 absent
        import psycopg2
        from psycopg2.extras import execute_values

        self._psycopg2 = psycopg2
        self._execute_values = execute_values

        self.conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", 5432)),
            dbname=os.getenv("DB_NAME", "school_db"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
        )
        self.conn.autocommit = False
        self.cur = self.conn.cursor()
        self.batch_size = int(os.getenv("DB_BATCH_SIZE", "1000"))

        # Mémoire locale des IDs insérés (évite des SELECT répétés)
        self.pays_ids: List[int] = []
        self.villes: List[Dict[str, Any]] = []         # [{id, pays_id, nom}]
        self.ecoles: List[Dict[str, Any]] = []         # [{id, ville_id, niveau_ecole}]
        self.annees: List[Dict[str, Any]] = []         # [{id, libelle, date_debut, date_fin}]
        self.niveaux: List[Dict[str, Any]] = []        # [{id, nom, ordre, cycle}]
        self.matieres: List[Dict[str, Any]] = []       # [{id, nom, code, coefficient, cycle}]
        self.enseignants: List[Dict[str, Any]] = []    # [{id, ecole_id, specialite}]
        self.classes: List[Dict[str, Any]] = []        # [{id, ecole_id, niveau_id, annee_id, nom}]
        # eleve_id → {niveau_ordre courant, niveau_moyen (talent)}
        self.eleves_profil: Dict[int, Dict[str, Any]] = {}
        # (eleve_id, annee_id) → classe_id
        self.inscriptions_map: Dict[Tuple[int, int], int] = {}

    # ------------------------------------------------------------------
    # Utilitaires SQL
    # ------------------------------------------------------------------

    def _insert_one(self, table: str, data: Dict[str, Any]) -> int:
        """Insère une ligne et retourne l'id généré."""
        cols = list(data.keys())
        placeholders = [f"%({c})s" for c in cols]
        sql = (
            f"INSERT INTO {table} ({', '.join(cols)}) "
            f"VALUES ({', '.join(placeholders)}) RETURNING id"
        )
        self.cur.execute(sql, data)
        row = self.cur.fetchone()
        if row is None:
            raise RuntimeError(f"Aucun id retourné après insertion dans {table}")
        return row[0]

    def _chunked(self, rows: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        if not rows:
            return []
        return [rows[i:i + self.batch_size] for i in range(0, len(rows), self.batch_size)]

    def _insert_many(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        on_conflict_do_nothing: bool = True,
    ) -> None:
        """Insère plusieurs lignes d'un coup (sans RETURNING)."""
        if not rows:
            return
        cols = list(rows[0].keys())
        sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES %s"
        if on_conflict_do_nothing:
            sql += " ON CONFLICT DO NOTHING"

        for chunk in self._chunked(rows):
            values = [[r[c] for c in cols] for r in chunk]
            self._execute_values(self.cur, sql, values)

    def _insert_many_returning_ids(self, table: str, rows: List[Dict[str, Any]]) -> List[int]:
        """Insère plusieurs lignes et retourne la liste des IDs générés."""
        if not rows:
            return []

        cols = list(rows[0].keys())
        sql = f"INSERT INTO {table} ({', '.join(cols)}) VALUES %s RETURNING id"

        inserted_ids: List[int] = []
        for chunk in self._chunked(rows):
            values = [[r[c] for c in cols] for r in chunk]
            returned = self._execute_values(self.cur, sql, values, fetch=True)
            inserted_ids.extend(row[0] for row in returned)

        return inserted_ids

    # ------------------------------------------------------------------
    # Étape 1 : Référentiels
    # ------------------------------------------------------------------

    def generate_pays(self) -> None:
        print("→ Insertion des pays…")
        data = PAYS_DATA[:NB_PAYS]
        ids = self._insert_many_returning_ids("pays", data)
        for pid in ids:
            self.pays_ids.append(pid)

    def generate_villes(self) -> None:
        print("→ Insertion des villes…")
        villes_fr = [
            "Paris", "Lyon", "Marseille", "Bordeaux", "Toulouse",
            "Nantes", "Strasbourg", "Lille", "Rennes", "Nice",
        ]
        villes_bj = [
            "Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi",
            "Djougou", "Bohicon", "Kandi", "Lokossa",
        ]
        villes_sn = [
            "Dakar", "Thiès", "Saint-Louis", "Ziguinchor",
            "Kaolack", "Mbour", "Rufisque", "Touba",
        ]
        pool_par_pays = [villes_fr, villes_bj, villes_sn]
        villes_rows: List[Dict[str, Any]] = []
        villes_meta: List[Tuple[int, str]] = []
        for i, pays_id in enumerate(self.pays_ids):
            pool = pool_par_pays[i] if i < len(pool_par_pays) else []
            noms = pool[:NB_VILLES_PAR_PAYS]
            for nom in noms:
                villes_rows.append(
                    {"nom": nom, "pays_id": pays_id, "code_postal": fake.postcode()}
                )
                villes_meta.append((pays_id, nom))

        ids = self._insert_many_returning_ids("villes", villes_rows)
        for vid, (pays_id, nom) in zip(ids, villes_meta):
            self.villes.append({"id": vid, "pays_id": pays_id, "nom": nom})

    def generate_niveaux(self) -> None:
        print("→ Insertion des niveaux scolaires…")
        ids = self._insert_many_returning_ids("niveaux", NIVEAUX_DATA)
        for nid, n in zip(ids, NIVEAUX_DATA):
            self.niveaux.append({"id": nid, **n})

    def generate_matieres(self) -> None:
        print("→ Insertion des matières…")
        ids = self._insert_many_returning_ids("matieres", MATIERES_DATA)
        for mid, m in zip(ids, MATIERES_DATA):
            self.matieres.append({"id": mid, **m})

    def generate_annees_scolaires(self) -> None:
        print("→ Insertion des années scolaires…")
        annees_raw = _annees_scolaires_entre(self.date_debut, self.date_fin)
        rows: List[Dict[str, Any]] = []
        for i, (libelle, debut, fin) in enumerate(annees_raw):
            is_last = i == len(annees_raw) - 1
            rows.append(
                {
                    "libelle": libelle,
                    "date_debut": debut,
                    "date_fin": fin,
                    "est_active": is_last,
                }
            )
        ids = self._insert_many_returning_ids("annees_scolaires", rows)
        for aid, (libelle, debut, fin) in zip(ids, annees_raw):
            self.annees.append({"id": aid, "libelle": libelle, "date_debut": debut, "date_fin": fin})

    # ------------------------------------------------------------------
    # Étape 2 : Écoles
    # ------------------------------------------------------------------

    def generate_ecoles(self) -> None:
        print("→ Insertion des écoles…")
        types = ["public", "prive", "communautaire"]
        niveaux_ecole = ["primaire", "college", "lycee"]
        rows: List[Dict[str, Any]] = []
        meta: List[Tuple[int, str]] = []
        for ville in self.villes:
            for _ in range(NB_ECOLES_PAR_VILLE):
                niveau = random.choice(niveaux_ecole)
                rows.append(
                    {
                        "nom": f"École {fake.last_name()} – {ville['nom']}",
                        "adresse": fake.street_address(),
                        "ville_id": ville["id"],
                        "type_ecole": random.choice(types),
                        "niveau_ecole": niveau,
                        "telephone": fake.phone_number()[:20],
                        "email": fake.company_email(),
                        "directeur": fake.name(),
                        "date_creation": _random_date_between(date(1980, 1, 1), date(2015, 1, 1)),
                        "capacite_max": random.randint(200, 1200),
                    }
                )
                meta.append((ville["id"], niveau))

        ids = self._insert_many_returning_ids("ecoles", rows)
        for eid, (ville_id, niveau) in zip(ids, meta):
            self.ecoles.append({"id": eid, "ville_id": ville_id, "niveau_ecole": niveau})

    # ------------------------------------------------------------------
    # Étape 3 : Classes (par école × niveau × année)
    # ------------------------------------------------------------------

    def _niveaux_pour_ecole(self, niveau_ecole: str) -> List[Dict[str, Any]]:
        cycle_map = {
            "primaire": "primaire",
            "college":  "college",
            "lycee":    "lycee",
            "mixte":    None,
        }
        cycle_filtre = cycle_map.get(niveau_ecole)
        if cycle_filtre:
            return [n for n in self.niveaux if n["cycle"] == cycle_filtre]
        return self.niveaux  # mixte → tous les niveaux

    def _matieres_pour_cycle(self, cycle: str) -> List[Dict[str, Any]]:
        return [m for m in self.matieres if m["cycle"] in (cycle, "tous")]

    def generate_classes(self) -> None:
        print("→ Insertion des classes…")
        sections = ["A", "B", "C"]
        rows: List[Dict[str, Any]] = []
        meta: List[Dict[str, Any]] = []
        for ecole in self.ecoles:
            niveaux_ecole = self._niveaux_pour_ecole(ecole["niveau_ecole"])
            for annee in self.annees:
                for niveau in niveaux_ecole:
                    for section in sections[:random.randint(1, 3)]:
                        nom_classe = f"{niveau['nom']} {section}"
                        rows.append(
                            {
                                "nom": nom_classe,
                                "ecole_id": ecole["id"],
                                "niveau_id": niveau["id"],
                                "annee_scolaire_id": annee["id"],
                                "effectif_max": random.randint(25, 45),
                                "salle": f"S{random.randint(1, 30):02d}",
                            }
                        )
                        meta.append(
                            {
                                "ecole_id": ecole["id"],
                                "niveau_id": niveau["id"],
                                "niveau_ordre": niveau["ordre"],
                                "cycle": niveau["cycle"],
                                "annee_id": annee["id"],
                                "nom": nom_classe,
                                "effectif_max": 40,
                            }
                        )

        ids = self._insert_many_returning_ids("classes", rows)
        for cid, cmeta in zip(ids, meta):
            self.classes.append({"id": cid, **cmeta})

    # ------------------------------------------------------------------
    # Étape 4 : Enseignants & affectations
    # ------------------------------------------------------------------

    def generate_enseignants(self) -> None:
        print("→ Insertion des enseignants…")
        rows: List[Dict[str, Any]] = []
        meta: List[Tuple[int, str]] = []
        for ecole in self.ecoles:
            nb = random.randint(8, 15)
            for _ in range(nb):
                genre = random.choice(["M", "F"])
                specialite = random.choice(self.matieres)["nom"]
                rows.append(
                    {
                        "nom": fake.last_name(),
                        "prenom": fake.first_name_male() if genre == "M" else fake.first_name_female(),
                        "email": fake.unique.email(),
                        "telephone": fake.phone_number()[:20],
                        "genre": genre,
                        "date_naissance": _random_date_between(date(1965, 1, 1), date(1995, 1, 1)),
                        "date_embauche": _random_date_between(date(1990, 1, 1), date(2022, 1, 1)),
                        "specialite": specialite,
                        "ecole_id": ecole["id"],
                    }
                )
                meta.append((ecole["id"], specialite))

        ids = self._insert_many_returning_ids("enseignants", rows)
        for eid, (ecole_id, specialite) in zip(ids, meta):
            self.enseignants.append({"id": eid, "ecole_id": ecole_id, "specialite": specialite})

    def generate_enseignements(self) -> None:
        """Affecte un enseignant par (classe, matière) de l'école."""
        print("→ Insertion des enseignements…")
        rows: List[Dict[str, Any]] = []
        for classe in self.classes:
            matieres_classe = self._matieres_pour_cycle(classe["cycle"])
            enseignants_ecole = [e for e in self.enseignants if e["ecole_id"] == classe["ecole_id"]]
            if not enseignants_ecole:
                continue
            for matiere in matieres_classe:
                enseignant = random.choice(enseignants_ecole)
                rows.append(
                    {
                        "enseignant_id": enseignant["id"],
                        "classe_id": classe["id"],
                        "matiere_id": matiere["id"],
                        "heures_hebdo": random.choice([1.5, 2.0, 3.0, 4.0]),
                    }
                )
        self._insert_many("enseignements", rows)

    # ------------------------------------------------------------------
    # Étape 5 : Élèves
    # ------------------------------------------------------------------

    def generate_eleves(self) -> None:
        """
        Génère un pool d'élèves pour la première année, puis les fait
        progresser d'une classe à l'autre sur toutes les années.
        """
        print("→ Génération des élèves et de leurs parcours…")

        # Grouper les classes de la première année par (ecole_id, niveau_id)
        premiere_annee = self.annees[0]
        classes_an1 = [c for c in self.classes if c["annee_id"] == premiere_annee["id"]]

        eleves_rows: List[Dict[str, Any]] = []
        eleves_meta: List[Tuple[int, float, int]] = []

        # Pour chaque classe de la première année, créer des élèves
        for classe in tqdm(classes_an1, desc="  Classes (an 1)"):
            nb_eleves = random.randint(
                max(1, NB_ELEVES_PAR_CLASSE - 5), NB_ELEVES_PAR_CLASSE + 5
            )
            for _ in range(nb_eleves):
                # Âge de l'élève en fonction du niveau
                age_base = 5 + classe["niveau_ordre"]  # CP≈6 ans, 6ème≈11 ans…
                naissance = _random_date_between(
                    date(premiere_annee["date_debut"].year - age_base - 1, 1, 1),
                    date(premiere_annee["date_debut"].year - age_base + 1, 12, 31),
                )
                genre = random.choice(["M", "F"])
                ville_id = random.choice(self.villes)["id"]
                eleves_rows.append(
                    {
                        "nom": fake.last_name(),
                        "prenom": fake.first_name_male() if genre == "M" else fake.first_name_female(),
                        "date_naissance": naissance,
                        "genre": genre,
                        "adresse": fake.street_address(),
                        "ville_id": ville_id,
                        "email_parent": fake.email(),
                        "telephone_parent": fake.phone_number()[:20],
                        "nom_parent": fake.name(),
                        "date_inscription": premiere_annee["date_debut"],
                        "nationalite": random.choice(["Française", "Béninoise", "Sénégalaise"]),
                    }
                )
                # Profil de l'élève : niveau de talent (centre de la distribution de notes)
                talent = random.gauss(11.0, 3.0)
                talent = max(4.0, min(18.0, talent))
                eleves_meta.append((classe["niveau_ordre"], talent, classe["id"]))

        eleves_ids = self._insert_many_returning_ids("eleves", eleves_rows)

        inscriptions_rows: List[Dict[str, Any]] = []
        for eleve_id, (niveau_ordre, talent, classe_id) in zip(eleves_ids, eleves_meta):
            self.eleves_profil[eleve_id] = {
                "niveau_ordre": niveau_ordre,
                "talent": talent,
            }
            inscriptions_rows.append(
                {
                    "eleve_id": eleve_id,
                    "classe_id": classe_id,
                    "annee_scolaire_id": premiere_annee["id"],
                    "date_inscription": premiere_annee["date_debut"],
                    "statut": "actif",
                }
            )
            self.inscriptions_map[(eleve_id, premiere_annee["id"])] = classe_id

        self._insert_many("inscriptions", inscriptions_rows, on_conflict_do_nothing=False)

        # Faire progresser les élèves sur les années suivantes
        for annee in self.annees[1:]:
            self._progresser_eleves(annee)

    def _inscrire_eleve(
        self,
        eleve_id: int,
        classe: Dict[str, Any],
        annee: Dict[str, Any],
        statut: str = "actif",
    ) -> None:
        self._insert_one(
            "inscriptions",
            {
                "eleve_id": eleve_id,
                "classe_id": classe["id"],
                "annee_scolaire_id": annee["id"],
                "date_inscription": annee["date_debut"],
                "statut": statut,
            },
        )
        self.inscriptions_map[(eleve_id, annee["id"])] = classe["id"]

    def _progresser_eleves(self, annee: Dict[str, Any]) -> None:
        """Fait passer les élèves actifs de l'année précédente vers l'année courante."""
        annee_index = next(i for i, a in enumerate(self.annees) if a["id"] == annee["id"])
        annee_precedente = self.annees[annee_index - 1]

        # Construire index classes de l'année courante: (ecole_id, niveau_ordre) → [classe]
        classes_annee: Dict[Tuple[int, int], List[Dict[str, Any]]] = {}
        for c in self.classes:
            if c["annee_id"] == annee["id"]:
                key = (c["ecole_id"], c["niveau_ordre"])
                classes_annee.setdefault(key, []).append(c)

        inscriptions_rows: List[Dict[str, Any]] = []
        progression_meta: List[Tuple[int, int, int]] = []

        for eleve_id, profil in self.eleves_profil.items():
            # Vérifier que l'élève était actif l'année précédente
            classe_id_prec = self.inscriptions_map.get((eleve_id, annee_precedente["id"]))
            if classe_id_prec is None:
                continue  # Élève pas encore inscrit (ne devrait pas arriver)

            # Statut de sortie possible
            if random.random() < TAUX_ABANDON:
                continue  # L'élève abandonne, pas de nouvelle inscription

            # Redoublement ou passage
            redouble = random.random() < TAUX_REDOUBLEMENT
            if redouble:
                nouveau_niveau_ordre = profil["niveau_ordre"]
            else:
                nouveau_niveau_ordre = profil["niveau_ordre"] + 1

            # Trouver la classe correspondante dans l'année courante
            # (même école si possible, sinon toute école avec ce niveau)
            classe_prec_info = next(
                (c for c in self.classes if c["id"] == classe_id_prec), None
            )
            ecole_id_prec = classe_prec_info["ecole_id"] if classe_prec_info else None

            cands = (
                classes_annee.get((ecole_id_prec, nouveau_niveau_ordre), [])
                if ecole_id_prec is not None
                else []
            )
            if not cands:
                # Chercher dans n'importe quelle école avec ce niveau
                cands = [
                    c
                    for (eid, niv), cs in classes_annee.items()
                    if niv == nouveau_niveau_ordre
                    for c in cs
                ]
            if not cands:
                continue  # Pas de classe disponible pour ce niveau cette année

            nouvelle_classe = random.choice(cands)
            statut = "redoublant" if redouble else "actif"
            inscriptions_rows.append(
                {
                    "eleve_id": eleve_id,
                    "classe_id": nouvelle_classe["id"],
                    "annee_scolaire_id": annee["id"],
                    "date_inscription": annee["date_debut"],
                    "statut": statut,
                }
            )
            progression_meta.append((eleve_id, annee["id"], nouvelle_classe["id"]))
            self.eleves_profil[eleve_id]["niveau_ordre"] = nouveau_niveau_ordre

        self._insert_many("inscriptions", inscriptions_rows, on_conflict_do_nothing=False)
        for eleve_id, annee_id, classe_id in progression_meta:
            self.inscriptions_map[(eleve_id, annee_id)] = classe_id

    # ------------------------------------------------------------------
    # Étape 6 : Évaluations & Notes
    # ------------------------------------------------------------------

    def generate_evaluations_et_notes(self) -> None:
        print("→ Génération des évaluations et notes…")
        types_eval = ["devoir", "composition", "interrogation"]

        for annee in tqdm(self.annees, desc="  Années"):
            trimestres_annee = _trimesters(annee["date_debut"])
            classes_annee = [c for c in self.classes if c["annee_id"] == annee["id"]]

            for classe in classes_annee:
                matieres_classe = self._matieres_pour_cycle(classe["cycle"])
                # Élèves de cette classe cette année
                eleves_classe = [
                    eid
                    for (eid, aid), cid in self.inscriptions_map.items()
                    if aid == annee["id"] and cid == classe["id"]
                ]
                if not eleves_classe:
                    continue

                evaluations_rows: List[Dict[str, Any]] = []
                eval_contexts: List[Tuple[date, List[int]]] = []

                for trimestre_num, t_debut, t_fin in trimestres_annee:
                    for matiere in matieres_classe:
                        for eval_num in range(1, NB_EVALUATIONS_PAR_MATIERE_PAR_TRIM + 1):
                            type_ev = "composition" if eval_num == 2 else random.choice(types_eval)
                            date_eval = _random_date_between(t_debut, t_fin)
                            evaluations_rows.append(
                                {
                                    "titre": f"{matiere['nom']} – {type_ev.capitalize()} T{trimestre_num} n°{eval_num}",
                                    "matiere_id": matiere["id"],
                                    "classe_id": classe["id"],
                                    "annee_scolaire_id": annee["id"],
                                    "type_evaluation": type_ev,
                                    "trimestre": trimestre_num,
                                    "date_debut": date_eval,
                                    "date_fin": None,
                                    "note_max": 20.0,
                                    "coefficient": float(eval_num),
                                }
                            )
                            eval_contexts.append((date_eval, eleves_classe))

                evaluation_ids = self._insert_many_returning_ids("evaluations", evaluations_rows)

                notes_rows: List[Dict[str, Any]] = []
                for eval_id, (date_eval, eleves_ids) in zip(evaluation_ids, eval_contexts):
                    for eleve_id in eleves_ids:
                        talent = self.eleves_profil.get(eleve_id, {}).get("talent", 10.0)
                        note = _note_aleatoire(niveau_eleve=talent)
                        notes_rows.append(
                            {
                                "evaluation_id": eval_id,
                                "eleve_id": eleve_id,
                                "note": note,
                                "observation": None,
                                "date_saisie": date_eval + timedelta(days=random.randint(1, 7)),
                            }
                        )
                self._insert_many("notes", notes_rows)

    # ------------------------------------------------------------------
    # Étape 7 : Absences
    # ------------------------------------------------------------------

    def generate_absences(self) -> None:
        print("→ Génération des absences…")
        absences_rows: List[Dict[str, Any]] = []
        for annee in self.annees:
            for (eleve_id, aid), classe_id in self.inscriptions_map.items():
                if aid != annee["id"]:
                    continue
                # ~30 % des élèves ont au moins une absence par an
                if random.random() > 0.30:
                    continue
                nb_absences = random.randint(1, 3)
                for _ in range(nb_absences):
                    debut_abs = _random_date_between(annee["date_debut"], annee["date_fin"])
                    duree = random.randint(1, 5)
                    fin_abs = debut_abs + timedelta(days=duree)
                    if fin_abs > annee["date_fin"]:
                        fin_abs = annee["date_fin"]
                    absences_rows.append(
                        {
                            "eleve_id": eleve_id,
                            "classe_id": classe_id,
                            "date_debut": debut_abs,
                            "date_fin": fin_abs,
                            "motif": random.choice(["Maladie", "Événement familial", "Voyage", None]),
                            "justifiee": random.random() < 0.6,
                        }
                    )
        self._insert_many("absences", absences_rows)

    # ------------------------------------------------------------------
    # Étape 8 : Bulletins
    # ------------------------------------------------------------------

    def generate_bulletins(self) -> None:
        """
        Calcule et insère les bulletins trimestriels en agrégeant les notes
        déjà présentes en base.
        """
        print("→ Génération des bulletins…")

        for annee in tqdm(self.annees, desc="  Années (bulletins)"):
            trimestres_annee = _trimesters(annee["date_debut"])
            classes_annee = [c for c in self.classes if c["annee_id"] == annee["id"]]

            for classe in classes_annee:
                eleves_classe = [
                    eid
                    for (eid, aid), cid in self.inscriptions_map.items()
                    if aid == annee["id"] and cid == classe["id"]
                ]
                if not eleves_classe:
                    continue

                for trimestre_num, _, _ in trimestres_annee:
                    # Récupérer toutes les notes du trimestre pour cette classe
                    self.cur.execute(
                        """
                        SELECT n.eleve_id,
                               SUM(n.note * ev.coefficient) AS note_pond,
                               SUM(ev.coefficient)          AS coeff_total
                        FROM notes n
                        JOIN evaluations ev ON ev.id = n.evaluation_id
                        WHERE ev.classe_id          = %s
                          AND ev.annee_scolaire_id  = %s
                          AND ev.trimestre          = %s
                          AND n.eleve_id            = ANY(%s)
                        GROUP BY n.eleve_id
                        """,
                        (classe["id"], annee["id"], trimestre_num, eleves_classe),
                    )
                    rows = self.cur.fetchall()
                    if not rows:
                        continue

                    moyennes = []
                    for eleve_id, note_pond, coeff_total in rows:
                        if coeff_total and coeff_total > 0:
                            moy = round(float(note_pond) / float(coeff_total), 2)
                            moy = max(0.0, min(20.0, moy))
                        else:
                            moy = None
                        moyennes.append((eleve_id, moy))

                    # Trier pour calculer le rang
                    moyennes_valides = [(eid, m) for eid, m in moyennes if m is not None]
                    moyennes_valides.sort(key=lambda x: x[1], reverse=True)
                    rang_map = {eid: i + 1 for i, (eid, _) in enumerate(moyennes_valides)}

                    bulletin_rows: List[Dict[str, Any]] = []
                    for eleve_id, moy in moyennes:
                        rang = rang_map.get(eleve_id)
                        bulletin_rows.append(
                            {
                                "eleve_id": eleve_id,
                                "classe_id": classe["id"],
                                "annee_scolaire_id": annee["id"],
                                "trimestre": trimestre_num,
                                "moyenne_generale": moy,
                                "rang": rang,
                                "appreciation": _appreciation(moy) if moy is not None else None,
                                "date_emission": _random_date_between(
                                    date(annee["date_fin"].year, annee["date_fin"].month - 1, 1)
                                    if annee["date_fin"].month > 1
                                    else annee["date_fin"],
                                    annee["date_fin"],
                                ),
                            }
                        )
                    self._insert_many("bulletins", bulletin_rows)

    # ------------------------------------------------------------------
    # Orchestration principale
    # ------------------------------------------------------------------

    def run(self) -> None:
        """Exécute toutes les étapes de génération dans l'ordre."""
        print(
            f"\n{'='*60}\n"
            f"  Génération des données scolaires\n"
            f"  Période : {self.date_debut} → {self.date_fin}\n"
            f"{'='*60}\n"
        )
        try:
            self.generate_pays()
            self.generate_villes()
            self.generate_niveaux()
            self.generate_matieres()
            self.generate_annees_scolaires()
            self.generate_ecoles()
            self.generate_classes()
            self.generate_enseignants()
            self.generate_enseignements()
            self.generate_eleves()
            self.generate_evaluations_et_notes()
            self.generate_absences()
            self.generate_bulletins()

            self.conn.commit()
            print("\n✅  Données générées et commitées avec succès !")
        except Exception as exc:
            self.conn.rollback()
            print(f"\n❌  Erreur : {exc}", file=sys.stderr)
            raise
        finally:
            self.cur.close()
            self.conn.close()

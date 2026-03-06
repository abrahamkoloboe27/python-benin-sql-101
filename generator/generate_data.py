"""
generate_data.py
================
Génère des données factices cohérentes pour la base de données scolaire,
les sauvegarde au format Parquet dans le dossier ``data/``, puis fournit
une fonction pour les insérer dans PostgreSQL.

Workflow recommandé
-------------------
    1. Génération en mémoire  → ``SchoolDataGenerator.generate()``
    2. Sauvegarde Parquet     → ``SchoolDataGenerator.save_to_parquet(data_dir)``
    3. Insertion en base      → ``insert_from_parquet(data_dir, conn)``

Variables globales de configuration
------------------------------------
    DATE_DEBUT : date de début de la période de génération (première rentrée).
    DATE_FIN   : date de fin de la période de génération (dernière fin d'année).

Utilisation directe (génération + Parquet uniquement, sans DB)
--------------------------------------------------------------
    python generate_data.py

Prérequis
---------
    - Un fichier .env à la racine du projet (voir .env.example).
    - pip install -r requirements.txt
"""

from __future__ import annotations

import math
import os
import random
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
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
# Ordre d'insertion (dépendances FK)
# ---------------------------------------------------------------------------
TABLES_ORDER: List[str] = [
    "pays",
    "villes",
    "annees_scolaires",
    "niveaux",
    "matieres",
    "ecoles",
    "classes",
    "enseignants",
    "enseignements",
    "eleves",
    "inscriptions",
    "evaluations",
    "notes",
    "absences",
    "bulletins",
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


# Observations textuelles associées aux notes individuelles.
# Environ 60 % des notes auront une observation non nulle.
_OBSERVATIONS_PAR_TRANCHE: Dict[str, List[str]] = {
    "excellent": [
        "Excellent travail, félicitations !",
        "Très bon résultat, continuez ainsi.",
        "Remarquable, bravo !",
        "Très bonne maîtrise du sujet.",
    ],
    "bien": [
        "Bon travail.",
        "Très satisfaisant.",
        "Bon résultat.",
        "Bonne prestation.",
    ],
    "assez_bien": [
        "Travail correct.",
        "Des progrès notables.",
        "Bon effort.",
        "Assez bien, peut encore progresser.",
    ],
    "passable": [
        "Peut mieux faire.",
        "Travail passable.",
        "Des efforts encore nécessaires.",
        "Résultat moyen, à améliorer.",
    ],
    "insuffisant": [
        "Travail insuffisant.",
        "Des lacunes importantes à combler.",
        "Doit fournir plus d'efforts.",
        "Résultat décevant, revoir les bases.",
    ],
}


def _observation_note(note: float) -> Optional[str]:
    """Retourne une observation textuelle pour une note (None ~40 % du temps)."""
    if random.random() > 0.6:
        return None
    if note >= 16:
        return random.choice(_OBSERVATIONS_PAR_TRANCHE["excellent"])
    if note >= 14:
        return random.choice(_OBSERVATIONS_PAR_TRANCHE["bien"])
    if note >= 12:
        return random.choice(_OBSERVATIONS_PAR_TRANCHE["assez_bien"])
    if note >= 10:
        return random.choice(_OBSERVATIONS_PAR_TRANCHE["passable"])
    return random.choice(_OBSERVATIONS_PAR_TRANCHE["insuffisant"])


# ---------------------------------------------------------------------------
# Classe principale de génération (en mémoire, sans accès à la base)
# ---------------------------------------------------------------------------

class SchoolDataGenerator:
    """
    Génère toutes les données scolaires factices en mémoire.

    N'interagit pas directement avec la base de données.
    Utilisez ``generate()`` puis ``save_to_parquet()`` pour produire les
    fichiers Parquet, et ``insert_from_parquet()`` pour les charger en base.

    Paramètres
    ----------
    date_debut : date de début de la période (première rentrée scolaire).
    date_fin   : date de fin de la période (dernière fin d'année scolaire).
    """

    def __init__(self, date_debut: date = DATE_DEBUT, date_fin: date = DATE_FIN) -> None:
        self.date_debut = date_debut
        self.date_fin = date_fin

        # Compteurs d'IDs séquentiels par table (simule SERIAL PostgreSQL)
        self._id_counters: Dict[str, int] = {}

        # Stockage en mémoire de toutes les lignes par table
        self._data: Dict[str, List[Dict[str, Any]]] = {t: [] for t in TABLES_ORDER}

        # Mémoire locale des IDs et métadonnées (même interface qu'avant)
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
    # Utilitaires en mémoire (remplacent les helpers SQL)
    # ------------------------------------------------------------------

    def _next_id(self, table: str) -> int:
        """Retourne le prochain ID séquentiel pour une table (simule SERIAL)."""
        self._id_counters[table] = self._id_counters.get(table, 0) + 1
        return self._id_counters[table]

    def _insert_one(self, table: str, data: Dict[str, Any]) -> int:
        """Enregistre une ligne en mémoire et retourne son ID."""
        row_id = self._next_id(table)
        self._data[table].append({"id": row_id, **data})
        return row_id

    def _insert_many(
        self,
        table: str,
        rows: List[Dict[str, Any]],
        on_conflict_do_nothing: bool = True,
    ) -> None:
        """Enregistre plusieurs lignes en mémoire (paramètre on_conflict ignoré)."""
        for row in rows:
            self._insert_one(table, row)

    def _insert_many_returning_ids(self, table: str, rows: List[Dict[str, Any]]) -> List[int]:
        """Enregistre plusieurs lignes en mémoire et retourne leurs IDs."""
        return [self._insert_one(table, row) for row in rows]

    # ------------------------------------------------------------------
    # Étape 1 : Référentiels
    # ------------------------------------------------------------------

    def generate_pays(self) -> None:
        print("→ Génération des pays…")
        data = PAYS_DATA[:NB_PAYS]
        ids = self._insert_many_returning_ids("pays", data)
        for pid in ids:
            self.pays_ids.append(pid)

    def generate_villes(self) -> None:
        print("→ Génération des villes…")
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
        print("→ Génération des niveaux scolaires…")
        ids = self._insert_many_returning_ids("niveaux", NIVEAUX_DATA)
        for nid, n in zip(ids, NIVEAUX_DATA):
            self.niveaux.append({"id": nid, **n})

    def generate_matieres(self) -> None:
        print("→ Génération des matières…")
        ids = self._insert_many_returning_ids("matieres", MATIERES_DATA)
        for mid, m in zip(ids, MATIERES_DATA):
            self.matieres.append({"id": mid, **m})

    def generate_annees_scolaires(self) -> None:
        print("→ Génération des années scolaires…")
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
        print("→ Génération des écoles…")
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
        print("→ Génération des classes…")
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
        print("→ Génération des enseignants…")
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
        print("→ Génération des enseignements…")
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
                            # Les compositions et examens peuvent s'étendre sur 1 à 3 jours
                            if type_ev in ("composition", "examen"):
                                date_fin_eval = date_eval + timedelta(days=random.randint(0, 2))
                                if date_fin_eval > t_fin:
                                    date_fin_eval = t_fin
                            else:
                                date_fin_eval = None
                            evaluations_rows.append(
                                {
                                    "titre": f"{matiere['nom']} – {type_ev.capitalize()} T{trimestre_num} n°{eval_num}",
                                    "matiere_id": matiere["id"],
                                    "classe_id": classe["id"],
                                    "annee_scolaire_id": annee["id"],
                                    "type_evaluation": type_ev,
                                    "trimestre": trimestre_num,
                                    "date_debut": date_eval,
                                    "date_fin": date_fin_eval,
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
                                "observation": _observation_note(note),
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
        Calcule les bulletins trimestriels en agrégeant les notes en mémoire.
        Remplace le calcul SQL par un calcul Python pur.
        """
        print("→ Génération des bulletins…")

        # Table de correspondance evaluation_id → infos utiles
        eval_lookup: Dict[int, Dict[str, Any]] = {
            row["id"]: row for row in self._data["evaluations"]
        }

        # Agrégation des notes par (eleve_id, classe_id, annee_scolaire_id, trimestre)
        note_aggregates: Dict[Tuple, Dict[str, float]] = defaultdict(
            lambda: {"note_pond": 0.0, "coeff_total": 0.0}
        )
        for note_row in self._data["notes"]:
            ev = eval_lookup.get(note_row["evaluation_id"])
            if ev is None:
                continue
            key = (
                note_row["eleve_id"],
                ev["classe_id"],
                ev["annee_scolaire_id"],
                ev["trimestre"],
            )
            note_aggregates[key]["note_pond"] += note_row["note"] * ev["coefficient"]
            note_aggregates[key]["coeff_total"] += ev["coefficient"]

        # Regroupement par (classe_id, annee_id, trimestre) pour calculer les rangs
        class_trimester_grades: Dict[Tuple, List[Tuple[int, Optional[float]]]] = defaultdict(list)
        for (eleve_id, classe_id, annee_id, trimestre), s in note_aggregates.items():
            if s["coeff_total"] > 0:
                moy: Optional[float] = round(
                    s["note_pond"] / s["coeff_total"], 2
                )
                moy = max(0.0, min(20.0, moy))
            else:
                moy = None
            class_trimester_grades[(classe_id, annee_id, trimestre)].append((eleve_id, moy))

        bulletin_rows: List[Dict[str, Any]] = []
        for annee in tqdm(self.annees, desc="  Années (bulletins)"):
            for classe in [c for c in self.classes if c["annee_id"] == annee["id"]]:
                for trimestre_num, _, _ in _trimesters(annee["date_debut"]):
                    eleve_moyennes = class_trimester_grades.get(
                        (classe["id"], annee["id"], trimestre_num), []
                    )
                    if not eleve_moyennes:
                        continue

                    # Trier les élèves pour calculer le rang
                    valides = sorted(
                        [(eid, m) for eid, m in eleve_moyennes if m is not None],
                        key=lambda x: x[1],
                        reverse=True,
                    )
                    rang_map = {eid: i + 1 for i, (eid, _) in enumerate(valides)}

                    for eleve_id, moy in eleve_moyennes:
                        bulletin_rows.append(
                            {
                                "eleve_id": eleve_id,
                                "classe_id": classe["id"],
                                "annee_scolaire_id": annee["id"],
                                "trimestre": trimestre_num,
                                "moyenne_generale": moy,
                                "rang": rang_map.get(eleve_id),
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

    def generate(self) -> None:
        """Génère toutes les données en mémoire (sans accès à la base)."""
        print(
            f"\n{'='*60}\n"
            f"  Génération des données scolaires\n"
            f"  Période : {self.date_debut} → {self.date_fin}\n"
            f"{'='*60}\n"
        )
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
        print("\n✅  Données générées en mémoire avec succès !")

    def save_to_parquet(self, data_dir: Path) -> None:
        """
        Sauvegarde toutes les tables générées au format Parquet.

        Paramètres
        ----------
        data_dir : chemin du dossier de destination (créé s'il n'existe pas).
        """
        data_dir = Path(data_dir)
        data_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n→ Sauvegarde Parquet dans {data_dir} …")
        for table in TABLES_ORDER:
            rows = self._data.get(table, [])
            if not rows:
                print(f"  ⚠  {table!r} vide, fichier ignoré.")
                continue
            df = pd.DataFrame(rows)
            parquet_path = data_dir / f"{table}.parquet"
            df.to_parquet(parquet_path, index=False)
            print(f"  ✓ {table}.parquet  ({len(df):,} lignes)")
        print("✅  Sauvegarde Parquet terminée.")

    def to_dataframes(self) -> Dict[str, "pd.DataFrame"]:
        """Retourne toutes les tables générées comme DataFrames pandas."""
        return {table: pd.DataFrame(rows) for table, rows in self._data.items()}


# ---------------------------------------------------------------------------
# Helpers de conversion de types pour psycopg2
# ---------------------------------------------------------------------------

def _to_python(v: Any) -> Any:
    """Convertit un scalaire pandas/numpy en type Python natif pour psycopg2."""
    if v is None:
        return None
    if v is pd.NaT:
        return None
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(v, pd.Timestamp):
        return v.date()
    if isinstance(v, np.integer):
        return int(v)
    if isinstance(v, np.floating):
        return None if math.isnan(v) else float(v)
    if isinstance(v, np.bool_):
        return bool(v)
    return v


# ---------------------------------------------------------------------------
# Insertion depuis les fichiers Parquet vers PostgreSQL
# ---------------------------------------------------------------------------

def insert_from_parquet(data_dir: Path, conn: Any, batch_size: int = 1000) -> None:
    """
    Charge les fichiers Parquet depuis ``data_dir`` et les insère dans
    PostgreSQL en respectant l'ordre des dépendances FK.

    Paramètres
    ----------
    data_dir   : dossier contenant les fichiers ``<table>.parquet``.
    conn       : connexion psycopg2 active (autocommit désactivé).
    batch_size : nombre de lignes insérées par lot.
    """
    from psycopg2.extras import execute_values

    data_dir = Path(data_dir)
    print(f"\n→ Insertion en base depuis {data_dir} …")
    conn.autocommit = False
    cur = conn.cursor()

    try:
        for table in TABLES_ORDER:
            parquet_path = data_dir / f"{table}.parquet"
            if not parquet_path.exists():
                print(f"  ⚠  {table}.parquet introuvable, sauté.")
                continue

            df = pd.read_parquet(parquet_path)
            if df.empty:
                print(f"  ⚠  {table}.parquet vide, sauté.")
                continue

            # Validation explicite : table ne peut être qu'une valeur connue de TABLES_ORDER
            if table not in TABLES_ORDER:
                raise ValueError(f"Nom de table non autorisé : {table!r}")

            cols = list(df.columns)
            # Convertir chaque ligne en liste de valeurs Python-natives
            rows_for_insert = [
                [_to_python(v) for v in row]
                for row in df.itertuples(index=False, name=None)
            ]

            sql = (
                f"INSERT INTO {table} ({', '.join(cols)}) VALUES %s"
                " ON CONFLICT DO NOTHING"
            )
            for i in range(0, len(rows_for_insert), batch_size):
                chunk = rows_for_insert[i : i + batch_size]
                execute_values(cur, sql, chunk)

            # Réinitialiser la séquence PostgreSQL après insertion avec IDs explicites
            cur.execute(
                f"SELECT setval("
                f"  pg_get_serial_sequence('{table}', 'id'),"
                f"  COALESCE(MAX(id), 1)"
                f") FROM {table}"
            )
            print(f"  ✓ {table}  ({len(df):,} lignes insérées)")

        conn.commit()
        print("✅  Insertion en base terminée avec succès !")
    except Exception as exc:
        conn.rollback()
        print(f"\n❌  Erreur lors de l'insertion : {exc}", file=sys.stderr)
        raise
    finally:
        cur.close()


# ---------------------------------------------------------------------------
# Point d'entrée direct (génération + Parquet uniquement, sans DB)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    _data_dir = Path(__file__).parent / "data"
    _generator = SchoolDataGenerator()
    _generator.generate()
    _generator.save_to_parquet(_data_dir)
"""
models.py
=========
Modèles Pydantic pour toutes les entités de la base de données scolaire.
Chaque modèle reflète fidèlement le schéma SQL (schema.sql).
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------------------------------------------------------------------------
# Pays
# ---------------------------------------------------------------------------
class Pays(BaseModel):
    id: Optional[int] = None
    nom: str = Field(..., max_length=100)
    code_iso: str = Field(..., min_length=2, max_length=2)
    continent: str = Field(..., max_length=50)
    created_at: Optional[datetime] = None

    @field_validator("code_iso")
    @classmethod
    def upper_iso(cls, v: str) -> str:
        return v.upper()


# ---------------------------------------------------------------------------
# Ville
# ---------------------------------------------------------------------------
class Ville(BaseModel):
    id: Optional[int] = None
    nom: str = Field(..., max_length=100)
    pays_id: int
    code_postal: Optional[str] = Field(None, max_length=20)
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Ecole
# ---------------------------------------------------------------------------
TypeEcole = Literal["public", "prive", "communautaire"]
NiveauEcole = Literal["primaire", "college", "lycee", "mixte"]


class Ecole(BaseModel):
    id: Optional[int] = None
    nom: str = Field(..., max_length=150)
    adresse: Optional[str] = Field(None, max_length=255)
    ville_id: int
    type_ecole: TypeEcole
    niveau_ecole: NiveauEcole
    telephone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=150)
    directeur: Optional[str] = Field(None, max_length=150)
    date_creation: Optional[date] = None
    capacite_max: Optional[int] = Field(None, gt=0)
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Année scolaire
# ---------------------------------------------------------------------------
class AnneeScolaire(BaseModel):
    id: Optional[int] = None
    libelle: str = Field(..., max_length=20)   # Ex: "2022-2023"
    date_debut: date
    date_fin: date
    est_active: bool = False
    created_at: Optional[datetime] = None

    @field_validator("date_fin")
    @classmethod
    def fin_apres_debut(cls, v: date, info) -> date:
        debut = info.data.get("date_debut")
        if debut and v <= debut:
            raise ValueError("date_fin doit être postérieure à date_debut")
        return v


# ---------------------------------------------------------------------------
# Niveau scolaire
# ---------------------------------------------------------------------------
CycleNiveau = Literal["primaire", "college", "lycee"]


class Niveau(BaseModel):
    id: Optional[int] = None
    nom: str = Field(..., max_length=50)
    ordre: int = Field(..., gt=0)
    cycle: CycleNiveau
    description: Optional[str] = Field(None, max_length=255)
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Classe
# ---------------------------------------------------------------------------
class Classe(BaseModel):
    id: Optional[int] = None
    nom: str = Field(..., max_length=50)
    ecole_id: int
    niveau_id: int
    annee_scolaire_id: int
    effectif_max: int = Field(40, gt=0)
    salle: Optional[str] = Field(None, max_length=20)
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Matière
# ---------------------------------------------------------------------------
CycleMatiere = Literal["primaire", "college", "lycee", "tous"]


class Matiere(BaseModel):
    id: Optional[int] = None
    nom: str = Field(..., max_length=100)
    code: str = Field(..., max_length=10)
    coefficient: float = Field(1.0, gt=0)
    cycle: Optional[CycleMatiere] = "tous"
    description: Optional[str] = None
    created_at: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def upper_code(cls, v: str) -> str:
        return v.upper()


# ---------------------------------------------------------------------------
# Enseignant
# ---------------------------------------------------------------------------
class Enseignant(BaseModel):
    id: Optional[int] = None
    nom: str = Field(..., max_length=100)
    prenom: str = Field(..., max_length=100)
    email: Optional[str] = Field(None, max_length=150)
    telephone: Optional[str] = Field(None, max_length=20)
    genre: Literal["M", "F"]
    date_naissance: Optional[date] = None
    date_embauche: Optional[date] = None
    specialite: Optional[str] = Field(None, max_length=100)
    ecole_id: Optional[int] = None
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Enseignement (affectation enseignant → classe × matière)
# ---------------------------------------------------------------------------
class Enseignement(BaseModel):
    id: Optional[int] = None
    enseignant_id: int
    classe_id: int
    matiere_id: int
    heures_hebdo: float = Field(2.0, gt=0)
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Elève
# ---------------------------------------------------------------------------
class Eleve(BaseModel):
    id: Optional[int] = None
    nom: str = Field(..., max_length=100)
    prenom: str = Field(..., max_length=100)
    date_naissance: date
    genre: Literal["M", "F"]
    adresse: Optional[str] = Field(None, max_length=255)
    ville_id: Optional[int] = None
    email_parent: Optional[str] = Field(None, max_length=150)
    telephone_parent: Optional[str] = Field(None, max_length=20)
    nom_parent: Optional[str] = Field(None, max_length=200)
    date_inscription: date
    nationalite: Optional[str] = Field(None, max_length=50)
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Inscription (élève → classe par année scolaire)
# ---------------------------------------------------------------------------
StatutInscription = Literal["actif", "transfere", "abandonne", "diplome", "redoublant"]


class Inscription(BaseModel):
    id: Optional[int] = None
    eleve_id: int
    classe_id: int
    annee_scolaire_id: int
    date_inscription: date
    statut: StatutInscription = "actif"
    motif_sortie: Optional[str] = Field(None, max_length=255)
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------
TypeEvaluation = Literal["devoir", "composition", "examen", "interrogation"]


class Evaluation(BaseModel):
    id: Optional[int] = None
    titre: str = Field(..., max_length=200)
    matiere_id: int
    classe_id: int
    annee_scolaire_id: int
    type_evaluation: TypeEvaluation
    trimestre: Literal[1, 2, 3]
    date_debut: date
    date_fin: Optional[date] = None
    note_max: float = Field(20.0, gt=0)
    coefficient: float = Field(1.0, gt=0)
    created_at: Optional[datetime] = None

    @field_validator("date_fin")
    @classmethod
    def fin_apres_debut(cls, v: Optional[date], info) -> Optional[date]:
        if v is not None:
            debut = info.data.get("date_debut")
            if debut and v < debut:
                raise ValueError("date_fin doit être >= date_debut")
        return v


# ---------------------------------------------------------------------------
# Note
# ---------------------------------------------------------------------------
class Note(BaseModel):
    id: Optional[int] = None
    evaluation_id: int
    eleve_id: int
    note: float = Field(..., ge=0)
    observation: Optional[str] = None
    date_saisie: date = Field(default_factory=date.today)
    created_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Absence
# ---------------------------------------------------------------------------
class Absence(BaseModel):
    id: Optional[int] = None
    eleve_id: int
    classe_id: int
    date_debut: date
    date_fin: date
    motif: Optional[str] = Field(None, max_length=255)
    justifiee: bool = False
    created_at: Optional[datetime] = None

    @field_validator("date_fin")
    @classmethod
    def fin_apres_debut(cls, v: date, info) -> date:
        debut = info.data.get("date_debut")
        if debut and v < debut:
            raise ValueError("date_fin doit être >= date_debut")
        return v


# ---------------------------------------------------------------------------
# Bulletin
# ---------------------------------------------------------------------------
class Bulletin(BaseModel):
    id: Optional[int] = None
    eleve_id: int
    classe_id: int
    annee_scolaire_id: int
    trimestre: Literal[1, 2, 3]
    moyenne_generale: Optional[float] = Field(None, ge=0, le=20)
    rang: Optional[int] = Field(None, gt=0)
    appreciation: Optional[str] = None
    date_emission: Optional[date] = None
    created_at: Optional[datetime] = None

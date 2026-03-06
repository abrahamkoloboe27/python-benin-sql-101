-- =============================================================================
-- Création du rôle et de l'utilisateur en lecture seule : python_bj
-- =============================================================================
-- Ce script crée :
--   1. Un rôle partagé « readonly » qui détient les privilèges SELECT.
--   2. Un utilisateur « python_bj » qui hérite de ce rôle.
--
-- Exécuter en tant que superutilisateur PostgreSQL (ex: postgres).
-- Remplacez « school_db » par le nom de votre base si nécessaire.
-- =============================================================================

-- 1. Créer le rôle partagé (pas de connexion directe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'readonly') THEN
        CREATE ROLE readonly NOLOGIN;
    END IF;
END
$$;

-- 2. Accorder la connexion à la base et l'utilisation du schéma public
GRANT CONNECT ON DATABASE school_db TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;

-- 3. Accorder SELECT sur toutes les tables et vues existantes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- 4. Propager automatiquement SELECT aux futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO readonly;

-- 5. Créer l'utilisateur python_bj et lui affecter le rôle readonly
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'python_bj') THEN
        CREATE USER python_bj WITH PASSWORD 'python_bj_sql_101_@2026';
    END IF;
END
$$;

GRANT readonly TO python_bj;

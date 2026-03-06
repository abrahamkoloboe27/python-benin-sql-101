# 🏋️ Challenges SQL – Python Bénin SQL 101

Bienvenue dans la section exercices !

Ces challenges sont là pour vous aider à pratiquer et consolider vos connaissances en SQL sur la base de données scolaire.

---

## Comment travailler

1. **Lisez l'énoncé** de chaque exercice attentivement.
2. **Écrivez votre requête** dans votre client SQL (DBeaver, TablePlus, psql…).
3. **Comparez votre résultat** avec la valeur attendue donnée en indice.
4. Si vous êtes bloqué, regardez les fiches dans `sql/basics/` pour vous inspirer.

---

## Les niveaux

| Fichier | Niveau | Description |
|---------|--------|-------------|
| [`niveau_1.sql`](niveau_1.sql) | 🟢 Débutant | SELECT, filtres simples, tri, COUNT |
| [`niveau_2.sql`](niveau_2.sql) | 🟡 Intermédiaire | GROUP BY, HAVING, JOINS, fonctions |
| [`niveau_3.sql`](niveau_3.sql) | 🔴 Avancé | Sous-requêtes, agrégats complexes, multi-jointures |

---

## Conseils

- 🔍 Explorez d'abord les tables avec `SELECT * FROM <table> LIMIT 10;`
- 📖 Consultez [`docs/schema.md`](../../docs/schema.md) pour comprendre les colonnes
- 🧩 Décomposez les requêtes complexes en petites étapes
- ✅ Vérifiez toujours le nombre de lignes retournées (cohérence avec la taille des tables)
- 💡 Si une requête met trop de temps, ajoutez `LIMIT 100` temporairement

---

## Structure des exercices

Chaque exercice suit ce format :

```sql
-- ============================================================
-- Exercice X – Titre
-- ============================================================
-- Énoncé : Description claire de ce qu'on attend.
-- Indice  : Indication sur l'approche ou la valeur attendue.
-- Tables  : Tables à utiliser
-- ============================================================

-- Écrivez votre requête ici :


```

Bonne chance ! 🚀

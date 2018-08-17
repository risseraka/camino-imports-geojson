# Camino imports geojson

Scripts pour convertir les bases de données des titres miniers (.geojson) en fichiers json prêts à importer dans la base de données de Camino.

Les fichiers sources doivent être placés dans le dossier `/sources` et respecter les noms suivants:

- `c.json`
- `g.json`
- `h.json`
- `m.json`
- `s.json`

Les fichiers transformés sont accessibles dans le dossier `/exports`.

```bash
# installation
npm i

# export des fichiers avec npm
npm run titres
```

# Camino imports geojson

Scripts pour convertir les bases de données des titres miniers (geojson) en fichiers json prêts à importer dans la base de données de Camino.

* Les fichiers sources doivent être placés dans le dossier `/sources` et respecter les noms suivants:
* * `g.json`
* * `h.json`
* * `m.json`
* * `s.json`
* Les fichiers transformés sont accessibles dans le dossier `/exports`.

```bash
# installation
npm i

# export des fichiers avec node
node /back.js g
node /back.js h
node /back.js m
node /back.js s

# export des fichiers avec npm
npm run back-g
npm run back-h
npm run back-m
npm run back-s
```

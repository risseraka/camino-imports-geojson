# Camino outils geojson

Outil pour convertir les bases de donnée des titres miniers (geojson) en fichiers compatibles avec Camino-front (json).

* Les fichiers sources doivent être placés dans le dossier `/sources` et respecter les noms suivants:
* * `geothermie.json`
* * `hydrocarbures.json`
* * `mineraux.json`
* * `stockage.json`
* Les fichiers transformés sont accessibles dans le dossier `/exports`.

```bash
# installation
npm i

# export des fichiers avec node
node /front.js geothermie
node /front.js hydrocarbures
node /front.js mineraux
node /front.js stockage

# export des fichiers avec npm
npm run front-g
npm run front-h
npm run front-m
npm run front-s
```

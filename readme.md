# Camino outils geojson

Outil pour convertir les base de donnée des titres miniers (geojson) en fichier compatible avec Camino-front (json).

* Les fichiers sources doivent être placés dans le dossier `sources` et respecter les noms suivants:
* * `titres-geothermie.json`
* * `titres-hydrocarbures.json`
* * `titres-mineraux.json`
* * `titres-stockage.json`
* Les fichiers transformés sont accessibles dans le dossier `exports`.

```bash
# installation
npm i

# export des fichiers
npm run build-geothermie
npm run build-hydrocarbures
npm run build-mineraux
npm run build-stockage
```

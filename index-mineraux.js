const fs = require('fs')
const _ = require('lodash')
const explode = require('@turf/explode')
const spliceString = require('splice-string')
const geojson = require('./sources/titres-mineraux.json')

const fileCreate = jsonObj => {
  let json = JSON.stringify(jsonObj)
  fs.writeFile('exports/titres-mineraux.json', json, 'utf8', err => {
    if (err) {
      console.log('fileCreate error', err)
    } else {
      console.log('File saved')
    }
  })
}

const newFile = geoJson => {
  const newGeoJson = geoJson.features.map(f => ({
    id: f.properties.CODE,
    nom: _.startCase(_.toLower(f.properties.NOM_TITRE)),
    type: _.capitalize(_.toLower(f.properties.NATURE)),
    statut: f.properties.STATUT,
    substances: {
      principales: _.replace(f.properties['SUBST_PRIN'], /,/g, '').split(' '),
      connexes: [f.properties.SUBST_AUTR]
    },
    références: {
      métier: f.properties.CODE
    },
    validité: {
      début: _.replace(f.properties.DATE_DEB, /\//g, '-')
        .split('-')
        .reverse()
        .join('-'),
      durée:
        Number(spliceString(f.properties.DATE_FIN, 1, 6)) -
        Number(spliceString(f.properties.DATE_DEB, 1, 6))
    },
    surface: f.properties.AREA,
    geojson: {
      type: 'FeatureCollection',
      features: f.geometry.coordinates.reduce(
        (res, shape, i) =>
          res.concat(
            shape.reduce((r, set) => {
              r.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: set
                },
                properties: {
                  type: `contour-${i}`
                }
              })
              return r
            }, [])
          ),
        []
      )
    },
    titulaires: [
      {
        index: f.properties['EXPLOITANT'],
        nom: f.properties['EXPLOITANT'],
        siret: '',
        adresse: {},
        contact: {}
      }
    ]
  }))
  return newGeoJson
}

fileCreate(newFile(geojson))

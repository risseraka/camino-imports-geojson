const fs = require('fs')
const _ = require('lodash')
const explode = require('@turf/explode')
const spliceString = require('splice-string')
const geojson = require('./sources/titres-geothermie.json')

const fileCreate = jsonObj => {
  let json = JSON.stringify(jsonObj)
  fs.writeFile('exports/titres-geothermie.json', json, 'utf8', err => {
    if (err) {
      console.log('fileCreate error', err)
    } else {
      console.log('File saved')
    }
  })
}

const newFile = geoJson => {
  const newGeoJson = geoJson.features.map(f => ({
    id: f.properties.NUMERO,
    nom: f.properties.NOM,
    type: _.capitalize(_.toLower(f.properties.TYPE_FR)),
    statut: 'Valide',
    substances: {
      principales: `Géomthermie ${_.toLower(f.properties.LEGENDE)}`
    },
    références: {
      métier: f.properties.NUMERO
    },
    validité: {
      début: _.replace(f.properties.DATE_JO_RF, /\//g, '-'),
      durée:
        (f.properties.DATE2
          ? Number(spliceString(f.properties.DATE2, 4, 6))
          : Number(spliceString(f.properties.DATE1, 4, 6))) -
        Number(spliceString(f.properties.DATE_JO_RF, 4, 6))
    },
    surface: f.properties.SUPERFICIE,
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
    titulaires: ['1', '2', '3']
      .filter(id => f.properties[`TIT_PET${id}`])
      .map(index => ({
        index: f.properties[`TIT_PET${index}`],
        nom: f.properties[`TIT_PET${index}`],
        siret: '',
        adresse: {},
        contact: {}
      }))
  }))
  return newGeoJson
}

fileCreate(newFile(geojson))

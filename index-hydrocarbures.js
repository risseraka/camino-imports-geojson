const fs = require('fs')
const _ = require('lodash')
const explode = require('@turf/explode')
const spliceString = require('splice-string')
const geojson = require('./sources/titres-hydrocarbures.json')

const fileCreate = jsonObj => {
  let json = JSON.stringify(jsonObj)
  fs.writeFile('exports/titres-hydrocarbures.json', json, 'utf8', err => {
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
      principales: 'Hydrocarbures liquides ou gazeux'
    },
    références: {
      métier: f.properties.NUMERO
    },
    validité: {
      début: _.replace(f.properties.DATE1, /\//g, '-'),
      durée:
        (f.properties.DATE3
          ? Number(spliceString(f.properties.DATE3, 4, 6))
          : Number(spliceString(f.properties.DATE2, 4, 6))) -
        Number(spliceString(f.properties.DATE1, 4, 6))
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
    titulaires: ['1', '2', '3', '4', '5', '6']
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

const fs = require('fs')
const _ = require('lodash')
const explode = require('@turf/explode')
const spliceString = require('splice-string')
const geojson = require('./sources/stockages.json')

const fileCreate = jsonObj => {
  let json = JSON.stringify(jsonObj)
  fs.writeFile('exports/titres.json', json, 'utf8', err => {
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
    nom: _.startCase(_.toLower(f.properties.NOM)),
    type: `Stockage ${_.toLower(f.properties.STOCKAGE)}`,
    statut: 'Valide',
    substances: {
      principales: [`${_.toLower(f.properties.CONTENU)}`]
    },
    volume: f.properties['EN_M³'],
    références: {
      métier: f.properties.NUMERO
    },
    validité: {
      début: _.replace(f.properties.DECRET_JO, /\//g, '-'),
      durée:
        Number(spliceString(f.properties.VALIDITE, 4, 6)) -
        Number(spliceString(f.properties.DECRET_JO, 4, 6))
    },
    surface: f.properties.MAPINFO,
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

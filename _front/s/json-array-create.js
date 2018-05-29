const _ = require('lodash')
const spliceString = require('splice-string')

module.exports = geoJson => {
  const newGeoJson = geoJson.features.map(geojsonFeature => ({
    id: geojsonFeature.properties.NUMERO,
    nom: _.startCase(_.toLower(geojsonFeature.properties.NOM)),
    type: `Stockage ${_.toLower(geojsonFeature.properties.STOCKAGE)}`,
    statut: 'Valide',
    substances: {
      principales: [`${_.toLower(geojsonFeature.properties.CONTENU)}`]
    },
    volume: geojsonFeature.properties['EN_M³'],
    références: {
      métier: geojsonFeature.properties.NUMERO
    },
    validité: {
      début: _.replace(geojsonFeature.properties.DECRET_JO, /\//g, '-'),
      durée:
        Number(spliceString(geojsonFeature.properties.VALIDITE, 4, 6)) -
        Number(spliceString(geojsonFeature.properties.DECRET_JO, 4, 6))
    },
    surface: geojsonFeature.properties.MAPINFO,
    geojson: {
      type: 'FeatureCollection',
      features: geojsonFeature.geometry.coordinates.reduce(
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
                  groupe: `contour-${i}`
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
        index: geojsonFeature.properties['EXPLOITANT'],
        nom: geojsonFeature.properties['EXPLOITANT'],
        siret: '',
        adresse: {},
        contact: {}
      }
    ]
  }))
  return newGeoJson
}

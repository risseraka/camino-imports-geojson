const _ = require('lodash')
const spliceString = require('splice-string')

module.exports = geoJson => {
  const newGeoJson = geoJson.features.map(geojsonFeature => ({
    id: geojsonFeature.properties.NUMERO,
    nom: geojsonFeature.properties.NOM,
    type: _.capitalize(_.toLower(geojsonFeature.properties.TYPE_FR)),
    statut: 'Valide',
    substances: {
      principales: 'Hydrocarbures liquides ou gazeux'
    },
    références: {
      métier: geojsonFeature.properties.NUMERO
    },
    validité: {
      début: _.replace(geojsonFeature.properties.DATE1, /\//g, '-'),
      durée:
        (geojsonFeature.properties.DATE3
          ? Number(spliceString(geojsonFeature.properties.DATE3, 4, 6))
          : Number(spliceString(geojsonFeature.properties.DATE2, 4, 6))) -
        Number(spliceString(geojsonFeature.properties.DATE1, 4, 6))
    },
    surface: geojsonFeature.properties.SUPERFICIE,
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
    titulaires: ['1', '2', '3', '4', '5', '6']
      .filter(id => geojsonFeature.properties[`TIT_PET${id}`])
      .map(index => ({
        index: geojsonFeature.properties[`TIT_PET${index}`],
        nom: geojsonFeature.properties[`TIT_PET${index}`],
        siret: '',
        adresse: {},
        contact: {}
      }))
  }))
  return newGeoJson
}

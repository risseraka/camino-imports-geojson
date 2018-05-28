const _ = require('lodash')
const spliceString = require('splice-string')

module.exports = geoJson => {
  const newGeoJson = geoJson.features.map(geojsonFeature => ({
    id: geojsonFeature.properties.CODE,
    nom: _.startCase(_.toLower(geojsonFeature.properties.NOM_TITRE)),
    type: _.capitalize(_.toLower(geojsonFeature.properties.NATURE)),
    statut: geojsonFeature.properties.STATUT,
    substances: {
      principales: _.replace(
        geojsonFeature.properties['SUBST_PRIN'],
        /,/g,
        ''
      ).split(' '),
      connexes: [geojsonFeature.properties.SUBST_AUTR]
    },
    références: {
      métier: geojsonFeature.properties.CODE
    },
    validité: {
      début: _.replace(geojsonFeature.properties.DATE_DEB, /\//g, '-')
        .split('-')
        .reverse()
        .join('-'),
      durée:
        Number(spliceString(geojsonFeature.properties.DATE_FIN, 1, 6)) -
        Number(spliceString(geojsonFeature.properties.DATE_DEB, 1, 6))
    },
    surface: geojsonFeature.properties.AREA,
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

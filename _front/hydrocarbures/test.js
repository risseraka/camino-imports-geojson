const _ = require('lodash')
const spliceString = require('splice-string')

module.exports = geoJson => {
  const newGeoJson = geoJson.features.map(geojsonFeature => ({
    type: _.capitalize(_.toLower(geojsonFeature.properties.TYPE_FR))
  }))
  return newGeoJson
}

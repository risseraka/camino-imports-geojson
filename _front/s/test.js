const _ = require('lodash')
const spliceString = require('splice-string')

module.exports = geoJson => {
  const newGeoJson = geoJson.features.map(f => ({
    type: `${_.toLower(f.properties.TYPE)}`
  }))
  return newGeoJson
}

const _ = require('lodash')
const spliceString = require('splice-string')

module.exports = geoJson => {
  const coordinates = geoJson.features.map(f => f.geometry.coordinates)
  return {
    type: 'Feature',
    properties: {
      type: 'stockage'
    },
    geometry: {
      type: 'MultiPolygon',
      coordinates: coordinates
    }
  }
}

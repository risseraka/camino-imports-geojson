module.exports = (geoJson, type) => {
  const coordinates = geoJson.features.map(f => f.geometry.coordinates)
  return {
    type: 'Feature',
    properties: {
      type: type
    },
    geometry: {
      type: 'MultiPolygon',
      coordinates: coordinates
    }
  }
}

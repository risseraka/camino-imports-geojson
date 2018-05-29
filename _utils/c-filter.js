const fileCreate = require('../_utils/file-create')
const cGeo = require('../_sources/c-geo.json')
const cList = require('../_sources/c-list.json')

const jsonArrayCreate = (list, geo) =>
  list.map(el => ({
    type: 'Feature',
    properties: el,
    geometry: geo.features.find(
      ge => ge.properties.CODE === el['references:ifremer']
    ).geometry
  }))

const jsonObj = {
  type: 'FeatureCollection',
  features: jsonArrayCreate(cList, cGeo)
}
const fileContent = JSON.stringify(jsonObj, null, 2)
const fileName = `_sources/c.json`

fileCreate(fileName, fileContent)

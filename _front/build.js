const fileCreate = require('../_file-create')
// const geojsonMultipolygonCreate = require('./geojson-multipolygon-create')

const build = domaineId => {
  console.log('Type:', domaineId)
  const source = require(`../_sources/${domaineId}.json`)
  const jsonArrayCreate = require(`./${domaineId}/json-array-create`)
  const jsonObj = jsonArrayCreate(source, domaineId)
  const fileContent = JSON.stringify(jsonObj, null, 2)
  const fileName = `_exports/front/${domaineId}.json`

  fileCreate(fileName, fileContent)
}

module.exports = build

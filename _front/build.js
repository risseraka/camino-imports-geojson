const fileCreate = require('../_file-create')
// const geojsonMultipolygonCreate = require('./geojson-multipolygon-create')

const build = type => {
  console.log('Type:', type)
  const source = require(`../_sources/${type}.json`)
  const jsonArrayCreate = require(`./${type}/json-array-create`)
  const jsonObj = jsonArrayCreate(source, 'type')
  const fileContent = JSON.stringify(jsonObj, null, 2)
  const fileName = `_exports/front/${type}.json`

  fileCreate(fileName, fileContent)
}

module.exports = build

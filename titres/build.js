const decamelize = require('decamelize')
const Json2csvParser = require('json2csv').Parser

const fileCreate = require('../_utils/file-create')
const arrayFlat = require('../_utils/array-flat.js')
const arrayMap = require('../_utils/array-map.js')
const objDedup = require('../_utils/object-dedup.js')
const objDecamelize = require('../_utils/object-decamelize.js')

const filesCreate = (json, domaine, key) => {
  const json2csvParser = new Json2csvParser()
  const jsonFileContent = JSON.stringify(objDecamelize(json), null, 2)
  const jsonFileName = `exports/json/${domaine}-${decamelize(key)}.json`
  const csvFileName = `exports/csv/${domaine}-${decamelize(key)}.csv`
  const csvFileContent = json2csvParser.parse(objDecamelize(json))
  fileCreate(jsonFileName, jsonFileContent)
  fileCreate(csvFileName, csvFileContent)
}

const objectsDedup = json =>
  objDedup(json, ['id', 'titreDemarcheId', 'titreId'])

const arraysKeys = [
  'titresSubstances',
  'titresPoints',
  'entreprises',
  'titresTitulaires'
]

const objectsKeys = [
  'titres',
  'titresDemarches',
  'titresDemarchesEtapes',
  'titresEmprises'
]

const build = domaineId => {
  console.log('Type:', domaineId)
  const geoJsonSource = require(`../sources/${domaineId}.json`)
  const jsonFormat = require(`./${domaineId}/json-format`)
  const jsonTmp = geoJsonSource.features.map(geojsonFeature =>
    jsonFormat(geojsonFeature)
  )

  objectsKeys.forEach(key => {
    filesCreate(objectsDedup(arrayMap(jsonTmp, key)), domaineId, key)
  })

  arraysKeys.forEach(key => {
    filesCreate(arrayFlat(arrayMap(jsonTmp, key)), domaineId, key)
  })
}

module.exports = build

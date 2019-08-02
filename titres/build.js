const decamelize = require('decamelize')
const Json2csvParser = require('json2csv').Parser
const csv = require('csvtojson')

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

  try {
    const csvFileContent = json2csvParser.parse(objDecamelize(json))
    fileCreate(jsonFileName, jsonFileContent)
    fileCreate(csvFileName, csvFileContent)
  } catch (e) {
    console.error(e)
    console.log({ json, domaine, key })
  }
}

const keys = [
  'titres',
  'titresDemarches',
  'titresDemarchesLiens',
  'titresPhases',
  'titresEtapes',
  'titresPoints',
  'titresPointsReferences',
  'titresSubstances',
  'titresDocuments',
  'titresTitulaires',
  'titresAmodiataires',
  'titresAdministrations',
  'titresUtilisateurs',
  'titresEmprises',
  'titresIncertitudes',
  'entreprises'
]

const build = async (domaineId, extension = 'json', type) => {
  let source
  if (extension === 'csv') {
    source = await csv().fromFile(`./sources/${domaineId}.csv`)
    source = {
      features: source.map(s => {
        try {
          return {
            properties: {
              ...s
              // type,
            },
            geometry: {
              coordinates:
                typeof s.coordinates === 'string'
                  ? JSON.parse(s.coordinates.replace(/'/g, '"') || '[]')
                  : s.coordinates
            }
          }
        } catch (e) {
          console.error(e, s)
          throw e
        }
      })
    }
  } else {
    source = require(`../sources/${domaineId}.json`)
  }

  const jsonFormat = require(`./${domaineId}/json-format`)
  const jsonTmp = await Promise.all(source.features.map(jsonFormat))

  keys.forEach(key =>
    filesCreate(
      objDedup(jsonTmp.reduce((r, j) => r.concat(j[key]), []), ['id']),
      domaineId,
      key
    )
  )
}

module.exports = build

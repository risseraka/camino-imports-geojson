const chalk = require('chalk')
const fileCreate = require('../_utils/file-create')

const objDedup = (json, key) =>
  json.reduce((res, cur) => {
    const buggy = cur[key] && res.find(e => e[key] === cur[key])
    if (buggy) console.log(chalk.red.bold(`Duplicate: ${buggy[key]}`))
    return buggy ? res : [...res, cur]
  }, [])

const arrayDedup = (arrayIn, arrayOut) =>
  arrayIn.filter(
    eNew => eNew && !arrayOut.find(e => eNew.id && eNew.id === e.id)
  )

const objectCreate = (tmpJson, type, table) => {
  let json = tmpJson.map(n => n[table])
  json = objDedup(json, 'id')
  json = objDedup(json, 'titrePhaseId')
  json = objDedup(json, 'titreId')
  const fileContent = JSON.stringify(json, null, 2)
  const fileName = `_exports/back/${type}-${table}.json`

  fileCreate(fileName, fileContent)
}

const arrayCreate = (tmpJson, type, table) => {
  let json = tmpJson
    .map(n => n[table])
    .reduce((res, arr) => [...res, ...arrayDedup(arr, res)], [])
  const fileContent = JSON.stringify(json, null, 2)
  const fileName = `_exports/back/${type}-${table}.json`

  fileCreate(fileName, fileContent)
}

const build = domaineId => {
  console.log('Type:', domaineId)
  const sourceJson = require(`../_sources/${domaineId}.json`)
  const jsonFormat = require(`./${domaineId}/json-format`)
  const tmpJson = sourceJson.features.map(geojsonFeature =>
    jsonFormat(geojsonFeature)
  )
  objectCreate(tmpJson, domaineId, 'titres')
  arrayCreate(tmpJson, domaineId, 'titres-substances-principales')
  arrayCreate(tmpJson, domaineId, 'titres-substances-secondaires')
  objectCreate(tmpJson, domaineId, 'titres-phases')
  objectCreate(tmpJson, domaineId, 'titres-phases-emprises')
  arrayCreate(tmpJson, domaineId, 'titres-geo-points')
  arrayCreate(tmpJson, domaineId, 'titulaires')
  arrayCreate(tmpJson, domaineId, 'titres-titulaires')
}

module.exports = build

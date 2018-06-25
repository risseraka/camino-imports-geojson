const chalk = require('chalk')
const fileCreate = require('../_utils/file-create')
const decamelize = require('decamelize')

const objDecamelize = obj =>
  obj.map(t =>
    Object.keys(t).reduce(
      (res, cur) => Object.assign(res, { [decamelize(cur)]: t[cur] }),
      {}
    )
  )

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

const objectCreate = (tmpJson, type, key) => {
  let json = tmpJson.map(n => n[key])
  json = objDedup(json, 'id')
  json = objDedup(json, 'titrePhaseId')
  json = objDedup(json, 'titreId')
  const fileContent = JSON.stringify(objDecamelize(json), null, 2)
  const fileName = `exports/back/${type}-${decamelize(key)}.json`

  fileCreate(fileName, fileContent)
}

const arrayCreate = (tmpJson, type, key) => {
  let json = tmpJson
    .map(n => n[key])
    .reduce((res, arr) => [...res, ...arrayDedup(arr, res)], [])
  const fileContent = JSON.stringify(objDecamelize(json), null, 2)
  const fileName = `exports/back/${type}-${decamelize(key)}.json`

  fileCreate(fileName, fileContent)
}

const build = domaineId => {
  console.log('Type:', domaineId)
  const sourceJson = require(`../sources/${domaineId}.json`)
  const jsonFormat = require(`./${domaineId}/json-format`)
  const tmpJson = sourceJson.features.map(geojsonFeature =>
    jsonFormat(geojsonFeature)
  )
  objectCreate(tmpJson, domaineId, 'titres')
  arrayCreate(tmpJson, domaineId, 'titresSubstances')
  objectCreate(tmpJson, domaineId, 'titresDemarches')
  objectCreate(tmpJson, domaineId, 'titresDemarchesEtapes')
  arrayCreate(tmpJson, domaineId, 'titresPoints')
  arrayCreate(tmpJson, domaineId, 'entreprises')
  arrayCreate(tmpJson, domaineId, 'titresTitulaires')
  objectCreate(tmpJson, domaineId, 'titresEmprises')
}

module.exports = build

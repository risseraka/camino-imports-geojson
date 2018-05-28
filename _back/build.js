const fileCreate = require('../_file-create')

const objectCreate = (tmpJson, type, table) => {
  const json = tmpJson.map(n => n[table])
  const fileContent = JSON.stringify(json, null, 2)
  const fileName = `_exports/back/${type}-${table}.json`

  fileCreate(fileName, fileContent)
}

const arrayCreate = (tmpJson, type, table) => {
  let json = tmpJson
    .map(n => n[table])
    .reduce(
      (res, arr) => [
        ...res,
        ...arr.filter(eNew => !res.find(e => eNew.id && eNew.id === e.id))
      ],
      []
    )
  const fileContent = JSON.stringify(json, null, 2)
  const fileName = `_exports/back/${type}-${table}.json`

  fileCreate(fileName, fileContent)
}

const build = type => {
  console.log('Type:', type)
  const sourceJson = require(`../_sources/${type}.json`)
  const jsonFormat = require(`./${type}/json-format`)
  const tmpJson = sourceJson.features.map(geojsonFeature =>
    jsonFormat(geojsonFeature)
  )
  objectCreate(tmpJson, type, 'titres')
  objectCreate(tmpJson, type, 'titres-substances-principales')
  objectCreate(tmpJson, type, 'titres-phases')
  objectCreate(tmpJson, type, 'titres-phases-emprises')
  arrayCreate(tmpJson, type, 'titres-geo-points')
  arrayCreate(tmpJson, type, 'titulaires')
  arrayCreate(tmpJson, type, 'titres-titulaires')
}

module.exports = build

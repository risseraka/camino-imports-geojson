const fileCreate = require('../_file-create')

const objectCreate = (tmpJson, type, table) => {
  const json = tmpJson.map(n => n[table])
  // json.reduce((res, cur) => {
  //   const buggy = cur.id && res.find(e => e.id === cur.id)
  //   console.log(cur, buggy)
  //   return buggy ? null : res
  // }, [])
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
        ...arr.filter(
          eNew => eNew && !res.find(e => eNew.id && eNew.id === e.id)
        )
      ],
      []
    )
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
  objectCreate(tmpJson, domaineId, 'titres-phases')
  objectCreate(tmpJson, domaineId, 'titres-phases-emprises')
  arrayCreate(tmpJson, domaineId, 'titres-geo-points')
  arrayCreate(tmpJson, domaineId, 'titulaires')
  arrayCreate(tmpJson, domaineId, 'titres-titulaires')
}

module.exports = build

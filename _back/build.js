const build = type => {
  console.log('Type:', type)
  const sourceJson = require(`../_sources/${type}.json`)
  const jsonArrayCreate = require(`./${type}/json-array-create`)
  jsonArrayCreate(sourceJson, type)
}

module.exports = build

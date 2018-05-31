const fileCreate = require('./file-create')
const titres = require('../_sources/m973.json')

console.log('start')

// titres.reduce((res, cur) => {
//   const buggy = cur.id && res.find(e => e.id === cur.id)
//   if (buggy) console.log(buggy.id)
//   return buggy ? res : [...res, cur]
// }, [])
const fileName = '_sources/m-test.json'
const json = titres.features
  .map(t => t.properties.statut)
  .reduce(
    (res, cur) => (cur && !res.find(r => r === cur) ? [...res, cur] : res),
    []
  )

const fileContent = JSON.stringify(json, null, 2)
fileCreate(fileName, fileContent)

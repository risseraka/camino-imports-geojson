const m = require('../_exports/back/m-titres.json')
const h = require('../_exports/back/h-titres.json')
const g = require('../_exports/back/g-titres.json')

const titres = [...g, ...h, ...m]

console.log('start')

titres.reduce((res, cur) => {
  const buggy = cur.id && res.find(e => e.id === cur.id)
  if (buggy) console.log(buggy.id)
  return buggy ? res : [...res, cur]
}, [])

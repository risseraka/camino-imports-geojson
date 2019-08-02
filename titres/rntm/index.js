const domaineId = 'rntm'
const build = require('../build')

try {
  build(domaineId, 'csv', 'rntm')
} catch (e) {
  console.error(e)
}

const arrayDedup = require('./array-dedup.js')

module.exports = json =>
  json.reduce((res, arr) => [...res, ...arrayDedup(arr, res, 'id')], [])

const decamelize = require('decamelize')

module.exports = obj =>
  obj.map(t =>
    Object.keys(t).reduce(
      (res, cur) => Object.assign(res, { [decamelize(cur)]: t[cur] }),
      {}
    )
  )

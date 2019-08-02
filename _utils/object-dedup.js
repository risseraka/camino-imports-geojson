const chalk = require('chalk')

const dedup = (json, key) =>
  json.reduce((res, cur) => {
    if (!cur) return res

    const dup = cur[key] && res.find(e => e[key] === cur[key])
    if (dup) console.log(chalk.red.bold(`Duplicate: ${dup[key]}`))
    return dup ? res : [...res, cur]
  }, [])

module.exports = (json, keys) =>
  Array.isArray(json)
    ? keys.reduce((res, key) => dedup(res, key), json)
    : dedup(json, key)

const chalk = require('chalk')

const dedup = (json, key) =>
  json.reduce((res, cur) => {
    const buggy = cur[key] && res.find(e => e[key] === cur[key])
    if (buggy) console.log(chalk.red.bold(`Duplicate: ${buggy[key]}`))
    return buggy ? res : [...res, cur]
  }, [])

module.exports = (json, keys) =>
  Array.isArray(json)
    ? keys.reduce((res, key) => dedup(res, key), json)
    : dedup(json, key)

module.exports = (json, key) =>
  json.reduce((r, n) => (n[key] ? [...r, n[key]] : r), [])

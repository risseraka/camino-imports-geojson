module.exports = (array1, array2, key) =>
  array1.filter(n => n && !array2.find(e => n[key] && n[key] === e[key]))

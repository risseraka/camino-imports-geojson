const fileName = 'titres-hydrocarbures'
const fileCreate = require('../_fileCreate')
const jsonArrayCreate = require('./jsonArrayCreate')

fileCreate(
  jsonArrayCreate(require(`../sources/${fileName}.json`)),
  `exports/${fileName}.json`
)

const fileName = 'titres-mineraux'
const fileCreate = require('../_fileCreate')
const jsonArrayCreate = require('./jsonArrayCreate')

fileCreate(
  jsonArrayCreate(require(`../sources/${fileName}.json`)),
  `exports/${fileName}.json`
)

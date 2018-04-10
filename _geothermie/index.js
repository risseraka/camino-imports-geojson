const fileName = 'titres-geothermie'
const fileCreate = require('../_fileCreate')
const jsonArrayCreate = require('./jsonArrayCreate')
const geojsonMultiPolygonCreate = require('./geojsonMultiPolygonCreate')

fileCreate(
  geojsonMultiPolygonCreate(require(`../sources/${fileName}.json`)),
  `exports/${fileName}.json`
)

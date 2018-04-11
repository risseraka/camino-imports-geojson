const fileName = 'titres-stockage'
const fileCreate = require('../_fileCreate')
const geojsonMultiPolygonCreate = require('./geojsonMultiPolygonCreate')

fileCreate(
  geojsonMultiPolygonCreate(require(`../sources/${fileName}.json`)),
  `exports/${fileName}.json`
)

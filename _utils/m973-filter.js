const fileCreate = require('../_utils/file-create')
const mAxm = require('../sources/m973-axm.json')
const mList = require('../sources/m973-cxx-prx-pxm.json')

const jsonObj = {
  type: 'FeatureCollection',
  features: [
    ...mAxm.features.map(f => {
      f.properties.type = 'axm'
      return f
    }),
    ...mList.features
  ]
    .map(f => {
      f.properties.subst_1 =
        f.properties.subst_1.toLowerCase() === 'or'
          ? 'Au'
          : f.properties.subst_1
      return f
    })
    .filter(f => f.properties.statut === 'valide')
}
const fileContent = JSON.stringify(jsonObj, null, 2)
const fileName = `sources/m973.json`

fileCreate(fileName, fileContent)

const fs = require('fs')

module.exports = (jsonObj, fileName) => {
  let json = JSON.stringify(jsonObj)
  fs.writeFile(fileName, json, 'utf8', err => {
    if (err) {
      console.log('fileCreate error', err)
    } else {
      console.log('File saved')
    }
  })
}

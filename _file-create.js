const fs = require('fs')

module.exports = (fileName, fileContent) => {
  fs.writeFile(fileName, fileContent, 'utf8', err => {
    if (err) {
      console.log('File: error', err)
    } else {
      console.log('File:', fileName)
    }
  })
}

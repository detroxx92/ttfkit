const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const ttfkit = require('./index')

var config = {
  font: {
    fontName: 'testFont',
    //copyright: 'bla bla copyright',
    //code: 59392,          // 0xE800
    //ascent: 850,
    //descent: 850 - 1000,  // ascent - units_per_em
    // weight: 400,
    //units_per_em: 1000,
    //width: 1000,
  }
}

var inputFiles = []
_.forEach(fs.readdirSync('C:\\delme\\icons'), (file) => {
  var content = fs.readFileSync(path.join('C:\\delme\\icons', file)).toString()

  inputFiles.push({
    fileName: file.substring(0, file.indexOf('.')),
    data: Buffer.from(content).toString('base64'),
  })
})

var result = ttfkit(config, inputFiles)
console.log(result)
fs.writeFileSync(path.join('C:\\delme\\', 'config.json'), result.config, 'base64')
fs.writeFileSync(path.join('C:\\delme\\', 'test.ttf'), result.ttf, 'base64')
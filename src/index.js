const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const svg2ttf = require('svg2ttf')
const svgpath = require('svgpath')
const XMLDomParser = require('xmldom').DOMParser

var quietTags = {
  'desc': true,
  'title': true,
  'metadata': true,
  'defs': true
}

var TEMPLATES_DIR = path.join(__dirname, '..', 'templates')
var SVG_TEMPLATE = _.template(fs.readFileSync(path.join(TEMPLATES_DIR, 'svg.tpl')))

function ttfkit(config, inputFiles) {
  config.font = config.font || {}
  config.font.fontName = config.font.fontName || 'font'
  config.font.copyright = config.font.copyright || 'Created by ttfkit'
  config.font.code = config.font.code || 59392 //0xE800
  config.font.ascent = config.font.ascent || 850
  config.font.descent = config.font.descent || 850 - 1000
  config.font.weight = config.font.weight || 400
  config.font.units_per_em = config.font.units_per_em || 1000
  config.font.width = config.font.width || 1000  
  config.glyphs = []

  var result = {
    config: null,
    ttf: null
  }

  _.forEach(inputFiles, (file) => {
    var glyph = getGlyph(file)
    config.glyphs.push(glyph)
  })
  
  // write config.json
  let config_json = JSON.stringify(config, null, 2)
  result.config = Buffer.from(config_json).toString('base64')
  
  // create ttf-file
  let output = SVG_TEMPLATE(config)
  let ttf = svg2ttf(output, { copyright: config.font.copyright })
  result.ttf = Buffer.from(ttf.buffer).toString('base64')

  return result
  
  function getGlyph(file) {
    var content = Buffer.from(file.data, 'base64').toString('utf-8')
    var result = getSvgPath(content)
  
    var scale = 1000 / result.height
    var d = new svgpath(result.d)
      .translate(-result.x, -result.y)
      .scale(scale)
      .abs().round(1).toString()
  
    var width = Math.round(result.width * scale) // new width
  
    scale = config.font.units_per_em / 1000
    let sp = svgpath(d)
      .scale(scale, -scale)
      .translate(0, config.font.ascent)
      .abs().round(0).rel()
  
    return {
      css: file.fileName,
      code: config.font.code++,
      d: sp.toString(),
      width: +(width * scale).toFixed(1)
    }
  }
  
  function getSvgPath(xml) {
    var error = null;
    var result = {
      d: '',
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      error,
    }
  
    var xmlDoc = (new XMLDomParser({
      errorHandler: {
        error(err) {
          error = err
        },
        fatalError(err) {
          error = err
        }
      }
    })).parseFromString(xml, 'application/xml')
  
    if (error) {
      result.error = error
      return result
    }
  
    var svg = xmlDoc.getElementsByTagName('svg')[0]
  
    var processed = processTree(svg, '', '')
    var coords = getCoordinates(svg)
  
    result.d = processed
    result.width = coords.width
    result.height = coords.height
    result.x = coords.x
    result.y = coords.y
  
    return result
  }
  
  function processTree(node, parentTransforms, path) {
    _.forEach(node.childNodes, function (item) {
      // skip "not node"
      if (item.nodeType !== 1) return
      if (quietTags[item.nodeName]) return
  
      var transforms = item.getAttribute('transform') ? parentTransforms + ' ' + item.getAttribute('transform') : parentTransforms;
      // Parse nested tags
      if (item.nodeName === 'g') {
        path = processTree(item, transforms, path)
      }
  
      // Get d from supported tag, else return
      var d = ''
      switch (item.nodeName) {
        case 'path':
          d = item.getAttribute('d')
          break
        case 'g':
          break
        default:
          ignoredTags[item.nodeName] = true
          return
      }
  
      var transformedPath = new svgpath(d).transform(transforms).toString()
      path += transformedPath;
    })
  
    return path
  }
  
  function getCoordinates(svg) {
    var viewBoxAttr = svg.getAttribute('viewBox')
  
    var viewBox = _.map(
      (viewBoxAttr || '').split(/(?: *, *| +)/g),
      function (val) {
        return parseFloat(val)
      }
    )
  
    // If viewBox attr has less than 4 digits it's incorrect
    if (viewBoxAttr && viewBox.length < 4) {
      return {
        error: new Error('Svg viewbox attr has less than 4 params')
      }
    }
  
    // getting base parameters
    var attr = {}
    _.forEach(['x', 'y', 'width', 'height'], function (key) {
      var val = svg.getAttribute(key)
  
      // TODO: remove and do properly
      // Quick hack - ignore values in %. There can be strange cases like
      // `width="100%" height="100%" viewbox="0 0 1000 1000"`
      if (val.length && val[val.length - 1] !== '%') {
        attr[key] = parseFloat(svg.getAttribute(key))
      }
    })
  
    if (viewBox[2] < 0 || viewBox[3] < 0 || attr.width < 0 || attr.height < 0) {
      return {
        error: new Error('Svg sizes can`t be negative')
      };
    }
  
    var result = {
      x: attr.x || 0,
      y: attr.y || 0,
      width: attr.width,
      height: attr.height,
      error: null
    }
  
    if (!viewBoxAttr) {
      // Only svg width & height attrs are set
      if (result.width && result.height) {
        return result
      }
  
      // viewBox not set and attrs not set
      result.error = new Error('Not implemented yet. There is no width or height');
      // TODO: Need calculate BBox
      return result
    }
  
    // viewBox is set and attrs not set
    if (!result.width && !result.height) {
      result.width = viewBox[2]
      result.height = viewBox[3]
      return result
    }
  
    return result
  }
}

module.exports = ttfkit
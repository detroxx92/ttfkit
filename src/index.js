const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const svgpath = require('svgpath')
const cheerio = require('cheerio')
const svg2ttf = require('svg2ttf')
const svgPath = require('svgpath')
const XMLDomParser = require('xmldom').DOMParser

var quietTags = {
    'desc': true,
    'title': true,
    'metadata': true,
    'defs': true
}

var TEMPLATES_DIR = path.join(__dirname, '..', 'templates')
var SVG_TEMPLATE = _.template(fs.readFileSync(path.join(TEMPLATES_DIR, 'svg.tpl')))
var ICON_PATH = 'C:\\delme\\icons'

var input_path = 'C:\\delme\\'
var output_file = 'C:\\delme\\testFont.ttf'

var code = 59392 // 0xE800
var units_per_em = 1000
var ascent = 850
var width = 1000
var font_weight = 400

var config = {
    font: {
        fontName: 'testFont',
        familyname: 'testFont',
        copyright: 'bla bla copyright',
        ascent: ascent,
        descent: ascent - units_per_em,
        weight: font_weight
    },
    glyphs: []
}

_.forEach(fs.readdirSync(ICON_PATH), (file) => {
    var glyph = getGlyph2(path.join(ICON_PATH, file))
    //var glyph = getGlyph(path.join(ICON_PATH, file))
    config.glyphs.push(glyph)
})

// write config.json
fs.writeFileSync(path.join(input_path, 'config.json'), JSON.stringify(config, null, 2))

// create .ttf
let output = SVG_TEMPLATE(config)
let ttf = svg2ttf(output, { copyright: config.font.copyright })
fs.writeFileSync(output_file, ttf.buffer)


function getGlyph(filePath) {
    var name = filePath.substring(filePath.lastIndexOf('\\') + 1, filePath.indexOf('.'))
    var d = getSvgPath(filePath)
    var scale = units_per_em / 1000
    let sp = svgpath(d)
        .scale(scale, -scale)
        .translate(0, ascent)
        .abs().round(0).rel()
        
    return {
        css: name,
        code: code++,
        d: sp.toString(),
        width: +(width * scale).toFixed(1),
        segments: sp.segments.length
    }
}

function getGlyph2(filePath) {
    var result = getSvgPath2(filePath)

    var scale = 1000 / result.height
    var d = new svgpath(result.d)
            .translate(-result.x, -result.y)
            .scale(scale)
            .abs()
            .round(1)
            .toString()
    var width = Math.round(result.width * scale) // new width
    var glyphname = filePath.substring(filePath.lastIndexOf('\\') + 1, filePath.indexOf('.'))

    scale = units_per_em / 1000
    let sp = svgpath(d)
        .scale(scale, -scale)
        .translate(0, ascent)
        .abs().round(0).rel()

    return {
        css: glyphname,
        code: code++,
        d: sp.toString(),
        //width: width
        width: +(width * scale).toFixed(1)
    }
}

function getSvgPath2(filePath) {
    var error = null;
    var result = {
        d: '',
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        error,
    }

    var xml = fs.readFileSync(filePath).toString()
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

        var transforms = item.getAttribute('transform') ? parentTransforms + ' ' + item.getAttribute('transform') :
                                                        parentTransforms;
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

        var transformedPath = new svgPath(d).transform(transforms).toString()
        path += transformedPath;
    })

    return path
}

function getCoordinates(svg) {
  var viewBoxAttr = svg.getAttribute('viewBox')

  var viewBox = _.map(
    (viewBoxAttr || '').split(/(?: *, *| +)/g),
    function (val) {
      return parseFloat(val);
    }
  )

  // If viewBox attr has less than 4 digits it's incorrect
  if (viewBoxAttr && viewBox.length < 4) {
    return {
      error : new Error('Svg viewbox attr has less than 4 params')
    };
  }

  // getting base parameters
  var attr = {};
  _.forEach([ 'x', 'y', 'width', 'height' ], function (key) {
    var val = svg.getAttribute(key);

    // TODO: remove and do properly
    // Quick hack - ignore values in %. There can be strange cases like
    // `width="100%" height="100%" viewbox="0 0 1000 1000"`
    if (val.length && val[val.length - 1] !== '%') {
      attr[key] = parseFloat(svg.getAttribute(key));
    }
  })

  if (viewBox[2] < 0 || viewBox[3] < 0 || attr.width < 0 || attr.height < 0) {
    return {
      error : new Error('Svg sizes can`t be negative')
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
      return result;
    }

    // viewBox not set and attrs not set
    result.error = new Error('Not implemented yet. There is no width or height');
    // TODO: Need calculate BBox
    return result;
  }

  // viewBox is set and attrs not set
  if (!result.width && !result.height) {
    result.width = viewBox[2];
    result.height = viewBox[3];
    return result;
  }

  return result;
}

function getSvgPath(filePath) {
    try {
        var content = fs.readFileSync(filePath, { encoding: 'utf-8' })
        var $ = cheerio.load(content)
        var fullPath = '';
        $('path').each(function() {
            var d = $(this).attr('d')
            fullPath += d.replace(/\s+/g, ' ') + ' '
        })
        return fullPath.trim()
    } catch (error) {
        console.error(error)
    }
}


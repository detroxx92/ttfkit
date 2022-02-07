const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const punycode = require('punycode/');

const SVGIcons2SVGFontStream = require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');

function ttfkit(fontConfig, output_function) {
    
    let fontName = fontConfig.fontName;

    let tmp_folder = "temp";
    if (!fs.existsSync(tmp_folder))
        fs.mkdirSync(tmp_folder);

    // starting unicode
    let unicode = 0xEA01;

    let font_stream = new SVGIcons2SVGFontStream({
        fontName: fontName,
        normalize: true,
    });
    let output_svg = path.join(tmp_folder, 'output.svg');
    let items = [];

    // iterate files in input_folder
    _.forEach(fontConfig.files, file => {
        let filePath = path.join(tmp_folder, file.name);
        fs.writeFileSync(filePath, Buffer.from(file.data, 'base64'));

        // create glyph from svg
        const glyph = fs.createReadStream(filePath);
        glyph.metadata = {
            unicode: [ punycode.ucs2.encode([unicode]) ],
            name: file.name,
        };
        font_stream.write(glyph);

        items.push({
            path: filePath,
            name: file.name,
            code: unicode.toString(16).toUpperCase()
        });

        // increment unicode character
        unicode +=1;
    });

    font_stream
    .pipe(fs.createWriteStream(output_svg))
    .on('finish', () => {
        // convert svg font to ttf file format
        let ttfData = svg2ttf(fs.readFileSync(output_svg, 'utf-8'), {});
        output_function(new Buffer.from(ttfData.buffer));
        //TODO: fix
        //res.json({
        //    name: fontName,
        //    data: new Buffer.from(ttfData.buffer).toString('base64')
        //});

        // cleanup
        fs.rmSync(output_svg);
        _.forEach(items, (item) => {
            fs.rmSync(item.path);
        });
    })
    .on('error', (err) => {
        console.log(err);
    });

    font_stream.end();
}

module.exports = ttfkit;

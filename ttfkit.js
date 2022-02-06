var ArgumentParser = require('argparse').ArgumentParser;

const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const ttfkit = require('./');

var parser = new ArgumentParser({
    add_help: true,
    description: 'SVG to TTF font converter'
});

parser.add_argument('-v', '--version', {
    action: 'version',
    version: require('./package.json').version
});

parser.add_argument('infolder', {
    nargs: 1,
    help: 'Input folder'
});
  
  parser.add_argument('outfile', {
    nargs: 1,
    help: 'Output file'
});

var args = parser.parse_args();

try {
    let build_config = {
        fontName: args.outfile[0],
        files: [],
    };

    _.forEach(fs.readdirSync(args.infolder[0]), (file) => {
        let filePath = path.parse(file);

        if (!filePath.ext.endsWith('svg')) return;

        build_config.files.push({
            name: filePath.name,
            data: fs.readFileSync(path.join(args.infolder[0], file), {encoding: 'base64'})
        });
    });

    ttfkit(build_config, (buffer) => {
        fs.writeFileSync(args.outfile[0], buffer);
    });
} catch (error) {
    console.error('error while execution: ' + error);
}
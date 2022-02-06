const _ = require('lodash');
const ttfkit = require('./');

var express = require('express');

var app = express();
app.use(express.json());

var server = app.listen(3000, () => {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Server listening at http://%s:%s", host, port);
});

app.post('/', (req, res) => {
    ttfkit(req.body, (buffer) => {
        res.json({
            name: req.body.fontName,
            data: buffer.toString('base64')
        });
    });
});
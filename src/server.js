var express = require('express')
var bodyParser = require('body-parser')
var ttfkit = require('./index')

const SERVER_MAX_FILE_SIZE = '50mb'
const SERVER_PORT = 3000

var app = express()
app.use(bodyParser.json({ limit: SERVER_MAX_FILE_SIZE }))
app.use(bodyParser.urlencoded({ limit: SERVER_MAX_FILE_SIZE, extended: true }))

var server = app.listen(SERVER_PORT, () => {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Server listening at http://%s:%s", host, port);
})

app.post('/', (req, res) => {
    var result = ttfkit(req.body.config, req.body.files)
    res.json(result);
})
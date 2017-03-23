//Dependencies:
var express=require('express')
var bodyParser=require('body-parser')
var fs = require('fs')
var http = require('http')
var https = require('https')
var server = express()

server.use(bodyParser.json())


//SSL:
//openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days XXX
var pass = 'Piera123'
var sslOptions = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  passphrase: pass
};

server.get('/',function(req,res) {
  console.log('request made.')
  res.end("This works.")
})

server.post('/createuser', function(req,res) {
  console.log(req.body)
  res.header("Content-Type",'serverlication/json');
  res.send(JSON.stringify(req.body, null, 4));
})


http.createServer(server).listen(3000)
https.createServer(sslOptions, server).listen(8000)

var express=require('express')
var bodyParser=require('body-parser')
var app = express()

app.use(bodyParser.json())


app.get('/',function(req,res) {
  console.log('request made.')
  res.end("This works.")
})

app.post('/createuser', function(req,res) {
  console.log(req.body)
  res.end("User recieved.")
})


app.listen(3000)

//Dependencies:
var express=require('express');
var bodyParser=require('body-parser');
var fs = require('fs');
var http = require('http');
var https = require('https');
var server = express();
//var path = require('path')
server.use(bodyParser.json());
server.use(express.static('public'));

class User {
  constructor(username, password, email, bio, classesEnrolled, typeOfUser) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.bio = bio;
    this.classesEnrolled = classesEnrolled;
    this.typeOfUser = typeOfUser;
  }
}

var users = [];
function login(email, password) {
  for(user in users) {
    if(users[user].email.localeCompare(email) == 0 && users[user].password.localeCompare(password) == 0) {
      return user;
    }
  }
  return 0;
}

//SSL:
//openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days XXX
var sslOptions = {
  key: fs.readFileSync('/etc/letsencrypt/live/www.piera.tk/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/www.piera.tk/fullchain.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/www.piera.tk/chain.pem')
};

server.get('/',function(req,res) {
  console.log('request made.');
  res.end("This works.");
});

server.post('/createuser', function(req,res) {
  console.log(req.body);
  var userData = req.body;
  var classesArr = []
  for(category in userData) {
    if(category.includes("class")) {
      classesArr.push(userData[category]);
    }
  }
  const newUser = new User(userData.username, userData.password, userData.email, userData.bio, classesArr, userData.typeOfUser);
  users.push(newUser);
  res.header("Content-Type",'serverlication/json');
  res.send(JSON.stringify(req.body, null, 4));
});

server.post('/login', function(req, res) {
  console.log(req.body);
  var loginData = req.body;
  const userLogedIn = login(loginData.email, loginData.password);
  if(userLogedIn == 0){
    const err = {"loginStatus": "0"};
    res.send(JSON.stringify(err, null, 4));
  } else {
    var response = {"username": userLogedIn.username, "password": userLogedIn.password, "email": userLogedIn.email, "bio": userLogedIn.bio, "typeOfUser": userLogedIn.typeOfUser, "loginStatus": "1"};
    var counter = 0;
    for(c in userLogedIn.classesEnrolled) {
      response["class"+counter] = userLogedIn.classesEnrolled[c];
      counter = counter + 1;
    }
    res.send(JSON.stringify(response, null, 4));
  }
});

http.createServer(server).listen(80);
https.createServer(sslOptions, server).listen(443);

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

var currentId = 0;

class Student {
  constructor(username, password, email, bio, classesEnrolled, interests) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.bio = bio;
    this.classesEnrolled = classesEnrolled;
    this.interests = interests;
    this.userId = currentId;
    currentId = currentId + 1;
  }
}

class Teacher {
  constructor(username, password, email, bio, classesEnrolled) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.bio = bio;
    this.classesEnrolled = classesEnrolled;
    this.userId = currentId;
    currentId = currentId + 1;
  }
}

var teachers = [];
var students = [];
function loginTeacher(email, password) {
  for(teacher in teachers) {
    if(teachers[teacher].email.localeCompare(email) == 0 && teachers[teacher].password.localeCompare(password) == 0) {
      return teachers[teacher];
    }
  }
  return 0;
}

function loginStudent(email, password) {
  for(student in students) {
    if(students[student].email.localeCompare(email) == 0 && students[student].password.localeCompare(password) == 0) {
      return students[student];
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

server.post('/createstudent', function(req,res) {
  console.log(req.body);
  console.log("creating student")
  var studentData = req.body;
  const newStudent = new Student(studentData.username, studentData.password, studentData.email, studentData.bio, studentData.classesEnrolled, studentData.interests);
  students.push(newStudent);
  var response = {"userId": newStudent.userId, "username": newStudent.username, "password": newStudent.password, "email": newStudent.email, "bio": newStudent.bio, "interests": newStudent.interests, "classesEnrolled": newStudent.classesEnrolled, "loginStatus": "1"};
  console.log(response)
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
});

server.post('/createteacher', function(req,res) {
  console.log(req.body);
  var teacherData = req.body;
  const newTeacher = new Teacher(teacherData.username, teacherData.password, teacherData.email, teacherData.bio, teacherData.classesEnrolled);
  teachers.push(newTeacher);
  var response = {"userId": newTeacher.userId, "username": newTeacher.username, "password": newTeacher.password, "email": newTeacher.email, "bio": newTeacher.bio, "classesEnrolled": newTeacher.classesEnrolled, "loginStatus": "1"};
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.post('/loginstudent', function(req, res) {
  console.log(req.body);
  var loginData = req.body;
  const student = loginStudent(loginData.email, loginData.password);
  if(student == 0){
    const err = {"loginStatus": "0"};
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(err, null, 4));
  } else {
    var response = {"userId": student.userId, "username": student.username, "password": student.password, "email": student.email, "bio": student.bio, "interests": student.interests, "classesEnrolled": student.classesEnrolled, "loginStatus": "1"};
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(response, null, 4));
  }
});

server.post('/loginteacher', function(req, res) {
  console.log(req.body);
  var loginData = req.body;
  const teacher = loginTeacher(loginData.email, loginData.password);
  if(teacher == 0){
    const err = {"loginStatus": "0"};
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(err, null, 4));
  } else {
    var response = {"userId": teacher.userId, "username": teacher.username, "password": teacher.password, "email": teacher.email, "bio": teacher.bio, "classesEnrolled": teacher.classesEnrolled, "loginStatus": "1"};
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(response, null, 4));
  }
});


http.createServer(server).listen(80);
https.createServer(sslOptions, server).listen(443);

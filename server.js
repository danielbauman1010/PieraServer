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
    this.requirements = ""
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

class Experiment {
  constructor(expname, time, explocation, descript, objective, maxParticipants, requirements) {
    this.expid = currentId;
    currentId = currentId + 1;
    this.expname = expname
    this.time = time;
    this.explocation = explocation;
    this.descript = descript;
    this.objective = objective;
    this.maxParticipants = maxParticipants;
    this.requirements = requirements;
    this.participants = [];
  }
}

var teachers = {};
var students = {};
var studentUCodes = {"1234": "MIT", "5678": "Harvard"};
var teacherUCodes = {"4321": "MIT", "8765": "Harvard"};
var studentsUniversity = {};
var teachersUniversity = {};
var experiments = {};
var teachersExperiments = {}

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


function listcontains(check,cont) {
    var result = true;
    for(i in check) {
        if(!(i in cont)){
            result = false;
        }
    }
    return result;
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
  var response;
  if(studentData.ucode in studentUCodes) {
    const newStudent = new Student(studentData.username, studentData.password, studentData.email, studentData.bio, studentData.classesEnrolled, studentData.interests);
    students[newStudent.userId] = newStudent
    studentsUniversity[newStudent.userId] = studentUCodes[studentData.ucode]
    response = {"userId": ""+newStudent.userId, "username": newStudent.username, "password": newStudent.password, "email": newStudent.email, "bio": newStudent.bio, "interests": newStudent.interests, "classesEnrolled": newStudent.classesEnrolled, "createStatus": "1"};
    console.log(response)
  } else {
    response = {"createStatus": "0"}
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
});

server.post('/createteacher', function(req,res) {
  console.log(req.body);
  var teacherData = req.body;
  var response;
  if(teacherData.ucode in teacherUCodes) {
    const newTeacher = new Teacher(teacherData.username, teacherData.password, teacherData.email, teacherData.bio, teacherData.classesEnrolled);
    teachers[newTeacher.userId] = newTeacher
    teachersUniversity[newTeacher.userId] = teacherUCodes[teacherData.ucode]
    response = {"userId": ""+newTeacher.userId, "username": newTeacher.username, "password": newTeacher.password, "email": newTeacher.email, "bio": newTeacher.bio, "classesEnrolled": newTeacher.classesEnrolled, "createStatus": "1"};
  } else {
    response = {"createStatus": "0"}
  }
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
    var response = {"userId": ""+student.userId, "username": student.username, "password": student.password, "email": student.email, "bio": student.bio, "interests": student.interests, "classesEnrolled": student.classesEnrolled, "loginStatus": "1"};
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
    var response = {"userId": ""+teacher.userId, "username": teacher.username, "password": teacher.password, "email": teacher.email, "bio": teacher.bio, "classesEnrolled": teacher.classesEnrolled, "loginStatus": "1"};
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(response, null, 4));
  }
});

server.post('/createexperiment', function(req,res) {
  console.log(req.body);
  var expData = req.body;
  const newExp = new Experiment(expData.expname, expData.time, expData.explocation, expData.descript, expData.objective, expData.maxParticipants, expData.requirements)
  var response;
  if(expData.authorID in teachers) {
    experiments[newExp.expid] = newExp
    teachersExperiments[newExp.expid] = expData.authorID
    console.log(newExp)
    response = {"author": ""+teachers[expData.authorID].username, "expid": ""+newExp.expid, "createStatus": "1"}
  } else {
    response = {"createStatus": "0"}
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/teacherexperiments/:id', function(req,res) {
  var response = {};
  var counter = 0;
  console.log(teachersExperiments)
  console.log(experiments)
  console.log(req.params.id)
  for(experiment in teachersExperiments) {
    if(teachersExperiments[experiment] == req.params.id) {
      response["expname"+counter] = ""+experiments[experiment].expname
      response["time"+counter] = ""+experiments[experiment].time
      response["explocation"+counter] = ""+experiments[experiment].explocation
      response["descript"+counter] = ""+experiments[experiment].descript
      response["objective"+counter] = ""+experiments[experiment].objective
      response["maxParticipants"+counter] = ""+experiments[experiment].maxParticipants
      response["requirements"+counter] = ""+experiments[experiment].requirements
      response["expid"] = ""+experiment
      counter = counter + 1
    }
  }
  if(counter == 0) {
    response["getStatus"] = "0"
  } else {
    response["getStatus"] = "1"
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/requirements', function(req,res) {
  var response = {"requirements": ""};
  console.log("/requirements request made")
  for(experiment in experiments) {
    if(response["requirements"].localeCompare("") == 0) {
      response["requirements"] = experiments[experiment].requirements
    } else {
      response["requirements"] = experiments[experiment].requirements + "," + response["requirements"];
    }
  }
  console.log(res["requirements"])
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/studentrequirements/:id', function(req,res) {
  console.log("Request made requirements")
  var response = {"requirements": ""};
  console.log(console.log(req.params.id));
  if(req.params.id in students) {
    response["requirements"] = students[req.params.id].requirements;
    response["getStatus"] = "1";
  } else {
    response["getStatus"] = "0";
  }
  console.log(response["requirements"])
  console.log(response["getStatus"])
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.post('/updaterequirements', function(req,res) {
  var response = {};
  if(req.body.userId in students) {
    if(students[req.body.userId].requirements.localeCompare("") == 0) {
      students[req.body.userId].requirements = req.body.requirements
    } else {
      students[req.body.userId].requirements = req.body.requirements;
    }
    console.log(students[req.body.userId].requirements)
    response["updateStatus"] = "1"
  } else {
    response["updateStatus"] = "0"
  }
  console.log('/updaterequirements request made')
  console.log(res['updateStatus'])
  console.log(req.body.requirements)

  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/searchforexperiments/:userId', function(req,res){
  response = {}
  if(req.params.userId in students) {
    for(experiment in experiments) {
      if(listcontains(experiments[experiment].requirements, students[req.params.userId].requirements)){
        response["expname"+counter] = ""+experiments[experiment].expname
        response["time"+counter] = ""+experiments[experiment].time
        response["explocation"+counter] = ""+experiments[experiment].explocation
        response["descript"+counter] = ""+experiments[experiment].descript
        response["objective"+counter] = ""+experiments[experiment].objective
        response["maxParticipants"+counter] = ""+experiments[experiment].maxParticipants
        response["requirements"+counter] = ""+experiments[experiment].requirements
        response["expid"] = ""+experiment
        response["searchStatus"] = '1'
      }
    }
  } else {
    response['searchStatus'] = '0'
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.post('/participate', function(req,res) {
  console.log(req.body);
  var data = req.body;
  var response = {};
  if(data.expid in experiments && data.userId in students) {
    experiments[data.expid].participants.push(data.userId);
    response["participateStatus"] = "1";
  } else {
    response["participateStatus"] = "0";
  }
  console.log(res)
  res.send(JSON.stringify(response, null, 4));
})

//http.createServer(server).listen(80);
https.createServer(sslOptions, server).listen(443);

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
  constructor(username, password, email, university) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.userId = currentId;
    this.requirements = ""
    this.experiments = []
    this.gradedExperiments = {}
    currentId = currentId + 1;
    this.university = university;
  }
}

class Admin {
  constructor(username, password, email, university) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.university = university;
    this.pertime = 0.5;
    this.required = 5.0;
    this.penalty = 0.0;
    this.userId = currentId;
    currentId = currentId = 1;
  }
}

class Teacher {
  constructor(username, password, email, university) {
    this.username = username;
    this.password = password;
    this.email = email;
    this.userId = currentId;
    this.experiments = []
    currentId = currentId + 1;
    this.university = university;
  }
}



class Experiment {
  constructor(expname, time, explocation, descript, objective, maxParticipants, requirements, authorId) {
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
    this.authorId = authorId;
  }
}

var teachers = {};
var students = {};
var admins = {};
var studentUCodes = {}; //code: university name
var teacherUCodes = {};
var adminUCodes = {}
var experiments = {};
var uniadmins = {}; //uniname: adminId

function login(email,password,ucode) {
  if(ucode in studentUCodes) {
    for(student in students) {
      if(students[student].email.localeCompare(email) == 0 && students[student].password.localeCompare(password) == 0) {
        return students[student];
      }
    }
    return 0;
  } else if(ucode in teacherUCodes) {
    for(teacher in teachers) {
      if(teachers[teacher].email.localeCompare(email) == 0 && teachers[teacher].password.localeCompare(password) == 0) {
        return teachers[teacher];
      }
    }
    return 0;
  } else if(ucode in adminUCodes) {
    for(admin in admins) {
      if(admins[admin].email.localeCompare(email) == 0 && admins[admin].password.localeCompare(password) == 0) {
        return admins[admin];
      }
    }
    return 0;
  } else {
    return 0;
  }
}

function notEmpty(value) {
  return value.localeCompare != 0;
}

function listcontains(check,cont) {
    var result = true;
    console.log(check);
    console.log(cont);
    for(i in check) {
        if(cont.indexOf(check[i]) < 0){
            result = false;
        }
    }
    return result;
}

function generateucode() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 7; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
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
  res.end("PIERA\nUse the app!");
});

server.get('/student/:userId', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.userId in students){
    var student = students[req.params.userId]
    response = {"userId": ""+student.userId, "username": ""+student.username, "email": ""+student.email, "university": ""+student.university, "getStatus": "1"};
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/teacher/:userId', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.userId in teachers){
    var teacher = teachers[req.params.userId]
    response = {"userId": ""+teacher.userId, "username": ""+teacher.username, "email": ""+teacher.email, "university": ""+teacher.university, "getStatus": "1"};
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/admin/:userId', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.userId in admins){
    var admin = admins[req.params.userId]
    response = {"userId": ""+admin.userId, "username": ""+admin.username, "email": ""+admin.email, "university": ""+admin.university, "getStatus": "1"};
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/experiment/:expid', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.expid in experiments){
    var experiment = experiments[req.params.expid];
    response["expname"] = ""+experiment.expname;
    response["time"] = ""+experiment.time;
    response["explocation"] = ""+experiment.explocation;
    response["descript"] = ""+experiment.descript;
    response["objective"] = ""+experiment.objective;
    response["maxParticipants"] = ""+experiment.maxParticipants;
    response["requirements"] = ""+experiment.requirements;
    response["expid"] = ""+experiment;
    response["authorId"] = ""+experiment.authorId;
    response["author"] = teachers[experiment.authorId].username+"";
    response["participants"] = experiment.participants+"";
    response["getStatus"] = "1";
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
});

server.get('/generateucodes/:uniname', function(req,res) {
  var response = {};
  var exists = false;
  for(uni in adminUCodes) {
    if(adminUCodes[uni].localeCompare(req.params.uniname) == 0) {
      exists = true;
    }
  }
  if(exists){
    response['generateStatus'] = '0';
  } else {
    var studentCode = generateucode();
    while(studentCode in studentUCodes){
      studentCode = generateucode();
    }
    response['studentucode'] = ""+studentCode;

    var teacherCode = generateucode();
    while(teacherCode in teacherUCodes){
      teacherCode = generateucode();
    }
    response['teacherucode'] = ""+teacherCode;

    var adminCode = generateucode();
    while(adminCode in adminUCodes){
      adminCode = generateucode();
    }
    response['adminucode'] = ""+adminCode;

    studentUCodes[studentCode] = req.params.uniname
    teacherUCodes[teacherCode] = req.params.uniname
    adminUCodes[adminCode] = req.params.uniname

    response['generateStatus'] = '1';
  }

  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.post('/signup', function(req,res) {
  var data = req.body;
  console.log(data);
  var response = {'createStatus': '0'};
  if(data.ucode in studentUCodes) {
    var newStudent = new Student(data.username, data.password, data.email, studentUCodes[data.ucode]);
    students[newStudent.userId] = newStudent
    response = {"userId": ""+newStudent.userId, "userType": "Student", "createStatus": "1"};
  } else if(data.ucode in teacherUCodes) {
    var newTeacher = new Teacher(data.username, data.password, data.email, teacherUCodes[data.ucode]);
    teachers[newTeacher.userId] = newTeacher
    response = {"userId": ""+newTeacher.userId, "userType": "Teacher", "createStatus": "1"};
  } else if(data.ucode in adminUCodes) {
    if(!(adminUCodes[data.ucode] in uniadmins)) {
      var newAdmin = new Admin(data.username, data.password, data.email, adminUCodes[data.ucode]);
      admins[newAdmin.userId] = newAdmin;
      uniadmins[adminUCodes[data.ucode]] = newAdmin.userId;
      response = {"userId": ""+newAdmin.userId, "userType": "Admin", "createStatus": "1"};
    }
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.post('/signin', function(req,res) {
  console.log(req.body);
  const loginResult = login(req.body.email, req.body.password, req.body.ucode);
  var response = {};
  if(loginResult instanceof Student) {
    response['loginStatus'] = '1';
    response['userId'] = ""+loginResult.userId;
    response['userType'] = 'Student';
  } else if(loginResult instanceof Teacher) {
    response['loginStatus'] = '1';
    response['userId'] = ""+loginResult.userId;
    response['userType'] = 'Teacher';
  } else if(loginResult instanceof Admin) {
    response['loginStatus'] = '1';
    response['userId'] = ""+loginResult.userId;
    response['userType'] = 'Admin';
  } else {
    response['loginStatus'] = '0';
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.post('/createexperiment', function(req,res) {
  console.log(req.body);
  var expData = req.body;
  const newExp = new Experiment(expData.expname, expData.time, expData.explocation, expData.descript, expData.objective, expData.maxParticipants, expData.requirements, expData.authorID)
  var response = {};
  if(expData.authorID in teachers) {
    experiments[newExp.expid] = newExp
    teachers[expData.authorID].experiments.push(newExp.expid)
    console.log(newExp)
    response = {"expid": ""+newExp.expid, "createStatus": "1"}
  } else {
    response = {"createStatus": "0"}
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/teacherexperiments/:id', function(req,res) {
  var response = {};
  console.log(experiments)
  console.log(req.params.id)
  if(req.params.id in teachers) {
    response["getStatus"] = "1"
    response['expids'] = ""+teachers[req.params.id].experiments
  } else {
    response["getStatus"] = "0"
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/studentexperiments/:userId', function(req,res) {
  var response = {};
  response["getStatus"] = '0'
  if(req.body.userId in students) {
    response["expids"] = ""+students[req.body.userId].experiments
    response["getStatus"] = '1'
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
});

server.get('/requirements', function(req,res) {
  var response = {"requirements": ""};
  console.log("/requirements request made")
  var requirements = [];
  for(experiment in experiments) {
    requirements.push(experiments[experiment].requirements)
  }
  response["requirements"] = ""+requirements.filter(notEmpty)
  console.log(response["requirements"])
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
    students[req.body.userId].requirements = req.body.requirements;
    console.log(students[req.body.userId].requirements)
    response["updateStatus"] = "1"
  } else {
    response["updateStatus"] = "0"
  }
  console.log('/updaterequirements request made')
  console.log(response['updateStatus'])
  console.log(req.body.requirements)

  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/searchforexperiments/:userId', function(req,res){
  response = {}
  var found = false;
  if(req.params.userId in students) {
    for(experiment in experiments) {
      if(listcontains(experiments[experiment].requirements.split(','), students[req.params.userId].requirements.split(',')) && !found && (experiments[experiment].maxParticipants > experiments[experiment].participants.length) && experiments[experiment].participants.indexOf(req.params.userId) < 0){
        response['expid'] = experiment;
        found = true;
      }
    }
  }
  if(!found){
    response["searchStatus"] = "0"
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
    students[data.userId].experiments[data.expid] = "N/A"
    response["participateStatus"] = "1";
  } else {
    response["participateStatus"] = "0";
  }
  console.log(response)
  res.send(JSON.stringify(response, null, 4));
})

server.get('/credits/:uniname', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.uniname in uniadmins) {
    response['getStatus'] = '1';
    response['pertime'] = admins[uniadmins[req.params.uniname]].pertime+"";
    response['required'] = admins[uniadmins[req.params.uniname]].required+"";
    response['penalty'] = admins[uniadmins[req.params.uniname]].penalty+"";
  }
  console.log(response);
  res.send(JSON.stringify(response, null, 4));
})

server.post('/updatecredits', function(req,res) {
  var response = {'updateStatus': '0'};
  if(req.body.userId in admins) {
    admins[req.body.userId].penalty = Number(req.body.penalty);
    admins[req.body.userId].pertime = Number(req.body.pertime);
    admins[req.body.userId].required = Number(req.body.required);
    response['updateStatus'] = '1';
  }
  console.log(response);
  res.send(JSON.stringify(response, null, 4));
})

server.post('/gradestudent', function(req,res) {
  var response = {'gradeStatus': '0'};
  if(req.body.userId in students) {
    if(req.body.expid in students[req.body.userId].experiments) {
      students[req.body.userId].experiments[req.body.expid] = req.body.grade;
      response['gradeStatus'] = '1';
    }
  }
  console.log(response);
  res.send(JSON.stringify(response, null, 4));
})



//http.createServer(server).listen(80);
https.createServer(sslOptions, server).listen(443);

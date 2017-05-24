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
    this.gradedExperiments = {} //dict: [expid: grade]
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

function removeFromArr(arr,val) {
  for(i in arr){
    if(arr[i]==val) {
      arr.splice(i,1)
    }
  }
  return arr
}

class Experiment {
  constructor(expname, time, timeToComplete, explocation, descript, objective, maxParticipants, requirements, authorId) {
    this.expid = currentId;
    currentId = currentId + 1;
    this.expname = expname
    this.time = time;
    this.timeToComplete = timeToComplete;
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

function addUserToResponse(response,user,counter) {
  response[counter+"userId"] = ""+user.userId;
  response[counter+"username"] = ""+user.username;
  response[counter+"email"] = ""+user.email;
  response[counter+"university"] = ""+user.university;
  return response;
}

function addExperimentToResponse(response,experiment,counter) {
  response[counter+"expname"] = ""+experiment.expname;
  response[counter+"time"] = ""+experiment.time;
  response[counter+"timeToComplete"] = ""+experiment.timeToComplete;
  response[counter+"explocation"] = ""+experiment.explocation;
  response[counter+"descript"] = ""+experiment.descript;
  response[counter+"objective"] = ""+experiment.objective;
  response[counter+"maxParticipants"] = ""+experiment.maxParticipants;
  response[counter+"requirements"] = ""+experiment.requirements;
  response[counter+"expid"] = ""+experiment.expid;
  response[counter+"authorId"] = ""+experiment.authorId;
  response[counter+"author"] = teachers[experiment.authorId].username+"";
  response[counter+"participants"] = experiment.participants+"";
  return response;
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
    var student = students[req.params.userId];
    response['getStatus'] = '1';
    response = addUserToResponse(response,student,"");
  }
  console.log(response);
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/teacher/:userId', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.userId in teachers){
    var teacher = teachers[req.params.userId]
    response['getStatus'] = '1';
    response = addUserToResponse(response,teacher,"");
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/admin/:userId', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.userId in admins){
    var admin = admins[req.params.userId];
    response['getStatus'] = '1';
    response = addUserToResponse(response,admin,"");
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/experiment/:expid', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.expid in experiments){
    var experiment = experiments[req.params.expid];
    response = addExperimentToResponse(r,experiment, "");
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
    response = {"userType": "Student", "createStatus": "1"};
    response = addUserToResponse(response, newStudent,"");
  } else if(data.ucode in teacherUCodes) {
    var newTeacher = new Teacher(data.username, data.password, data.email, teacherUCodes[data.ucode]);
    teachers[newTeacher.userId] = newTeacher
    response = {"userType": "Teacher", "createStatus": "1"};
    response = addUserToResponse(response, newTeacher,"");
  } else if(data.ucode in adminUCodes) {
    if(!(adminUCodes[data.ucode] in uniadmins)) {
      var newAdmin = new Admin(data.username, data.password, data.email, adminUCodes[data.ucode]);
      admins[newAdmin.userId] = newAdmin;
      uniadmins[adminUCodes[data.ucode]] = newAdmin.userId;
      response = {"userType": "Admin", "createStatus": "1"};
      response = addUserToResponse(response, newAdmin,"");
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
    response = addUserToResponse(response,students[loginResult.userId],"");
    response['userType'] = 'Student';
  } else if(loginResult instanceof Teacher) {
    response['loginStatus'] = '1';
    response = addUserToResponse(response,teachers[loginResult.userId],"");
    response['userType'] = 'Teacher';
  } else if(loginResult instanceof Admin) {
    response['loginStatus'] = '1';
    response = addUserToResponse(response,admins[loginResult.userId],"");
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
  const newExp = new Experiment(expData.expname, expData.time, expData.timeToComplete, expData.explocation, expData.descript, expData.objective, expData.maxParticipants, expData.requirements, expData.authorID)
  var response = {};
  if(expData.authorID in teachers) {
    experiments[newExp.expid] = newExp
    teachers[expData.authorID].experiments.push(newExp.expid)
    console.log(newExp);
    response = {"createStatus": "1"};
    response = addExperimentToResponse(response, newExp, "");
  } else {
    response = {"createStatus": "0"}
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/teacherexperiments/:id', function(req,res) {
  var response = {};
  console.log(experiments);
  console.log(req.params.id);
  if(req.params.id in teachers) {
    response["getStatus"] = "1";
    var exps = teachers[req.params.id].experiments;
    for(experiment in exps) {
      response = addExperimentToResponse(response,exps[experiment],experiment+"");
    }
  } else {
    response["getStatus"] = "0"
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.get('/studentexperiments/:userId', function(req,res) {
  var response = {};
  response["getStatus"] = '0'
  if(req.params.userId in students) {
    for(exp in students[req.params.userId].experiments) {
        response = addExperimentToResponse(response, students[req.params.userId].experiments[exp],exp)
    }
    response["getStatus"] = '1'
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
});

server.get('/studenthistory/:userId', function(req,res) {
  var response = {'getStatus': '0'};
  if(req.params.userId in students) {
    response['getStatus'] = '1';
    var counter = 0;
    for(e in students[req.params.userId].gradedExperiments) {
      response = addExperimentToResponse(response, experiments[e], counter);
      response[counter+"grade"] = students[req.params.userId].gradedExperiments[e];
      counter = counter + 1;
    }
  }
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

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
        response['searchStatus'] = '1';
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
    students[data.userId].experiments.push(data.expid);
    response["participateStatus"] = "1";
  } else {
    response["participateStatus"] = "0";
  }
  console.log(response)
  res.header("Content-Type",'application/json');
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
  res.header("Content-Type",'application/json');
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
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})

server.post('/gradestudent', function(req,res) {
  var response = {'gradeStatus': '0'};
  if(req.body.userId in students) {
    if(students[req.body.userId].experiments.indexOf(req.body.expid) >= 0) {
      students[req.body.userId].gradedExperiments[req.body.expid] = req.body.grade;
      students[req.body.userId].experiments = removeFromArr(students[req.body.userId].experiments, req.body.expid);
      response['gradeStatus'] = '1';
    }
  }
  console.log(response);
  res.header("Content-Type",'application/json');
  res.send(JSON.stringify(response, null, 4));
})


//http.createServer(server).listen(80);
https.createServer(sslOptions, server).listen(443);

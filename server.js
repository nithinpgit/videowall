var config  = require('./config.js');
var express = require('express'),
    spdy = require('spdy'),
    bodyParser = require('body-parser'),
    errorhandler = require('errorhandler'),
    morgan = require('morgan'),
    icsREST = require('./rest');
var app     = express();
var https   = require('https');
var http   = require('http');
var fs      = require('fs');
var socket  = require('socket.io');
var options = {
    key : fs.readFileSync(config.key),
    cert: fs.readFileSync(config.cert),
    ca: [fs.readFileSync(config.ca)]
};
var server = https.createServer(options,app).listen(config.port);
var mongoose = require('mongoose');
mongoose.connect(config.dbUrl); 
var ObjectID   = require('mongodb').ObjectID; 

app.use(errorhandler());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, OPTIONS, DELETE');
  res.header('Access-Control-Allow-Headers', 'origin, content-type');
  if (req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});

icsREST.API.init(config.serviceId, config.serviceKey, config.mcuUrl, true);
var sampleRoom;
var pageOption = { page: 1, per_page: 100 };
(function initSampleRoom () {
  icsREST.API.getRooms(pageOption, function(rooms) {
    console.log(rooms.length + ' rooms in this service.');
    for (var i = 0; i < rooms.length; i++) {
      if (sampleRoom === undefined && rooms[i].name === 'sampleRoom') {
        sampleRoom = rooms[i]._id;
        console.log('sampleRoom Id:', sampleRoom);
      }
      if (sampleRoom !== undefined) {
        break;
      }
    }
    var tryCreate = function(room, callback) {
      var options = {};
      icsREST.API.createRoom(room.name, options, function(roomID) {
        console.log('Created room:', roomID._id);
        callback(roomID._id);
      }, function(status, err) {
        console.log('Error in creating room:', err, '[Retry]');
        setTimeout(function() {
          tryCreate(room, options, callback);
        }, 100);
      }, room);
    };

    var room;
    if (!sampleRoom) {
      room = {
        name: 'sampleRoom'
      };
      tryCreate(room, function(Id) {
        sampleRoom = Id;
        console.log('sampleRoom Id:', sampleRoom);
      });
    }
  });
})();


////////////////////////////////////////////////////////////////////////////////////////////
// legacy interface begin
// /////////////////////////////////////////////////////////////////////////////////////////
app.get('/getUsers/:room', function(req, res) {
  var room = req.params.room;
  icsREST.API.getParticipants(room, function(users) {
    res.send(users);
  }, function(err) {
    res.send(err);
  });
});

app.post('/createToken/', function(req, res) {
  var room = req.body.room || sampleRoom,
    username = req.body.username,
    role = req.body.role;
  //FIXME: The actual *ISP* and *region* info should be retrieved from the *req* object and filled in the following 'preference' data.
  var preference = {isp: 'isp', region: 'region'};
  icsREST.API.createToken(room, username, role, preference, function(token) {
    res.send(token);
  }, function(err) {
    res.send(err);
  });
});

app.post('/createRoom/', function(req, res) {
  'use strict';
  var name = req.body.name;
  var options = req.body.options;
  icsREST.API.createRoom(name, options, function(response) {
    res.send(response);
  }, function(err) {
    res.send(err);
  });
});
app.get('/getRooms/', function(req, res) {
  'use strict';
  icsREST.API.getRooms(pageOption, function(rooms) {
    res.send(rooms);
  }, function(err) {
    res.send(err);
  });
});

app.get('/getRoom/:room', function(req, res) {
  'use strict';
  var room = req.params.room;
  icsREST.API.getRoom(room, function(rooms) {
    res.send(rooms);
  }, function(err) {
    res.send(err);
  });
});

app.get('/room/:room/user/:user', function(req, res) {
  'use strict';
  var room = req.params.room;
  var participant_id = req.params.user;
  icsREST.API.getParticipant(room, participant_id, function(user) {
    res.send(user);
  }, function(err) {
    res.send(err);
  });
});

app.delete('/room/:room/user/:user', function(req, res) {
  'use strict';
  var room = req.params.room;
  var participant_id = req.params.user;
  icsREST.API.dropParticipant(room, participant_id, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
})

app.delete('/room/:room', function(req, res) {
  'use strict';
  var room = req.params.room;
  icsREST.API.deleteRoom(room, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
})
////////////////////////////////////////////////////////////////////////////////////////////
// legacy interface begin
// /////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////
// New RESTful interface begin
// /////////////////////////////////////////////////////////////////////////////////////////
app.post('/rooms', function(req, res) {
  'use strict';
  var name = req.body.name;
  var options = req.body.options;
  icsREST.API.createRoom(name, options, function(response) {
    res.send(response);
  }, function(err) {
    res.send(err);
  });
});

app.get('/rooms', function(req, res) {
  'use strict';
  icsREST.API.getRooms(pageOption, function(rooms) {
    res.send(rooms);
  }, function(err) {
    res.send(err);
  });
});

app.get('/rooms/:room', function(req, res) {
  'use strict';
  var room = req.params.room;
  icsREST.API.getRoom(room, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.put('/rooms/:room', function(req, res) {
  'use strict';
  var room = req.params.room,
    config = req.body;
  icsREST.API.updateRoom(room, config, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.patch('/rooms/:room', function(req, res) {
  'use strict';
  var room = req.params.room,
    items = req.body;
  icsREST.API.updateRoomPartially(room, items, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.delete('/rooms/:room', function(req, res) {
  'use strict';
  var room = req.params.room;
  icsREST.API.deleteRoom(room, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.get('/rooms/:room/participants', function(req, res) {
  'use strict';
  var room = req.params.room;
  icsREST.API.getParticipants(room, function(participants) {
    res.send(participants);
  }, function(err) {
    res.send(err);
  });
});

app.get('/rooms/:room/participants/:id', function(req, res) {
  'use strict';
  var room = req.params.room;
  var participant_id = req.params.id;
  icsREST.API.getParticipant(room, participant_id, function(info) {
    res.send(info);
  }, function(err) {
    res.send(err);
  });
});

app.patch('/rooms/:room/participants/:id', function(req, res) {
  'use strict';
  var room = req.params.room;
  var participant_id = req.params.id;
  var items = req.body;
  icsREST.API.updateParticipant(room, participant_id, items, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.delete('/rooms/:room/participants/:id', function(req, res) {
  'use strict';
  var room = req.params.room;
  var participant_id = req.params.id;
  icsREST.API.dropParticipant(room, participant_id, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.get('/rooms/:room/streams', function(req, res) {
  'use strict';
  var room = req.params.room;
  icsREST.API.getStreams(room, function(streams) {
    res.send(streams);
  }, function(err) {
    res.send(err);
  });
});

app.get('/rooms/:room/streams/:stream', function(req, res) {
  'use strict';
  var room = req.params.room,
    stream_id = req.params.stream;
  icsREST.API.getStream(room, stream_id, function(info) {
    res.send(info);
  }, function(err) {
    res.send(err);
  });
});

app.patch('/rooms/:room/streams/:stream', function(req, res) {
  'use strict';
  var room = req.params.room,
    stream_id = req.params.stream,
    items = req.body;
  icsREST.API.updateStream(room, stream_id, items, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.delete('/rooms/:room/streams/:stream', function(req, res) {
  'use strict';
  var room = req.params.room,
    stream_id = req.params.stream;
  icsREST.API.deleteStream(room, stream_id, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.post('/rooms/:room/streaming-ins', function(req, res) {
  'use strict';
  var room = req.params.room,
    url = req.body.url,
    transport = req.body.transport,
    media = req.body.media;

  icsREST.API.startStreamingIn(room, url, transport, media, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.delete('/rooms/:room/streaming-ins/:id', function(req, res) {
  'use strict';
  var room = req.params.room,
    stream_id = req.params.id;
  icsREST.API.stopStreamingIn(room, stream_id, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.get('/rooms/:room/streaming-outs', function(req, res) {
  'use strict';
  var room = req.params.room;
  icsREST.API.getStreamingOuts(room, function(streamingOuts) {
    res.send(streamingOuts);
  }, function(err) {
    res.send(err);
  });
});

app.post('/rooms/:room/streaming-outs', function(req, res) {
  'use strict';
  var room = req.params.room,
    url = req.body.url,
    media = req.body.media;

  icsREST.API.startStreamingOut(room, url, media, function(info) {
    res.send(info);
  }, function(err) {
    res.send(err);
  });
});

app.patch('/rooms/:room/streaming-outs/:id', function(req, res) {
  'use strict';
  var room = req.params.room,
    id = req.params.id,
    commands = req.body;
  icsREST.API.updateStreamingOut(room, id, commands, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.delete('/rooms/:room/streaming-outs/:id', function(req, res) {
  'use strict';
  var room = req.params.room,
    id = req.params.id;
  icsREST.API.stopStreamingOut(room, id, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.get('/rooms/:room/recordings', function(req, res) {
  'use strict';
  var room = req.params.room;
  icsREST.API.getRecordings(room, function(streamingOuts) {
    res.send(streamingOuts);
  }, function(err) {
    res.send(err);
  });
});

app.post('/rooms/:room/recordings', function(req, res) {
  'use strict';
  var room = req.params.room,
    container = req.body.container,
    media = req.body.media;
  icsREST.API.startRecording(room, container, media, function(info) {
    res.send(info);
  }, function(err) {
    res.send(err);
  });
});

app.patch('/rooms/:room/recordings/:id', function(req, res) {
  'use strict';
  var room = req.params.room,
    id = req.params.id,
    commands = req.body;
  icsREST.API.updateRecording(room, id, commands, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.delete('/rooms/:room/recordings/:id', function(req, res) {
  'use strict';
  var room = req.params.room,
    id = req.params.id;
  icsREST.API.stopRecording(room, id, function(result) {
    res.send(result);
  }, function(err) {
    res.send(err);
  });
});

app.post('/tokens', function(req, res) {
  'use strict';
  var room = req.body.room || sampleRoom,
    user = req.body.user,
    role = req.body.role;

  //Note: The actual *ISP* and *region* information should be retrieved from the *req* object and filled in the following 'preference' data.
  var preference = {isp: 'isp', region: 'region'};
  icsREST.API.createToken(room, user, role, preference, function(token) {
    res.send(token);
  }, function(err) {
    res.status(401).send(err);
  });
});
////////////////////////////////////////////////////////////////////////////////////////////
// New RESTful interface end
////////////////////////////////////////////////////////////////////////////////////////////
var User                 = require('./models/User');
//var server               = http.createServer(app).listen(config.port);
var io = require('socket.io')(server);
app.use(express.static('public'));
console.log('meetRTC is running at port : '+config.port);
var userList = {};
var totalUsers = 0;
var publicChat = [];
io.on('connection',function(socket){
    totalUsers++;
    socket.emit('mysocket',socket.id);
    socket.on('message', function(message) { 
       var data = JSON.parse(message);
       switch (data.method) {
           case 'register':
               socket.join(data.room);
               socket.room = data.room;
               break;
            case 'login':
               onLogin(data,socket)
            break;
           default:
              io.sockets.in(data.room).emit('message', message);
              console.log('send to all in '+data.room+' data='+message);
           break;
       }
   });  

   socket.on("disconnect", function() { 
	    if(totalUsers > 0){
            totalUsers--;
        }
   });  

});

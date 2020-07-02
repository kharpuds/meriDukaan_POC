var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var map = require('hashmap');

app.get('/', function (req, res) {
   res.sendfile('index.html');
});

app.get('/createroom', function (req, res) {
   res.sendfile('createroom.html');
});

app.get('/joinroom', function (req, res) {
   res.sendfile('joinroom.html');
});

var roomno = 1;
var rooms = [];
var roomUserMap = new map();
var userLimitMap = new map();

io.on('connection', function (socket) {

   //Increase roomno 2 clients are present in a room.
   // if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 4) roomno++;
   // socket.join("room-"+roomno);

   // //Send this event to everyone in the room.
   // io.sockets.in("room-"+roomno).emit('connectToRoom', "You are in room no. "+roomno);

   socket.on('createRoom', function (data) {
      let users = new Set();
      userLimitMap.set(roomno, data.limit);
      rooms.push(roomno);
      roomUserMap.set(roomno, users);
      socket.emit("roomCreated", { description: "Room " + roomno + " created for " + userLimitMap.get(roomno) + " users" });
      console.log("Max no of users for room " + roomno + " is " + userLimitMap.get(roomno));
      roomno++;
   });


   socket.on('joinRoom', function (data) {
      var present = false;
      var validUsername = false;
      var enteredCode = Number(data.code);
      var enteredName = data.name;
      var users = [];
      var booltest;


      if (!roomUserMap.has(enteredCode)) {
         console.log("Room code is invalid");
         socket.emit('errorJoiningRoom', { description: "Room code is invalid, please enter valid room code" });
      }
      else if (!enteredName) {
         console.log("Invalid username");
         socket.emit('errorJoiningRoom', { description: "Invalid user name...Please enter valid username" });
      }

      else {

         if (roomUserMap.get(enteredCode).has(enteredName)) {
            console.log("Username already present")
            socket.emit('errorJoiningRoom', { description: "The username already exists, please choose another username" });
         }
         else if (roomUserMap.get(enteredCode).size == userLimitMap.get(enteredCode)) {
            console.log("Room full");
            socket.emit('errorJoiningRoom', { description: "This room is full, please create a new room" });
         }
         else {
            roomUserMap.get(enteredCode).add(enteredName);
            users = Array.from(roomUserMap.get(enteredCode));
            console.log(roomUserMap.get(enteredCode).size + " Players in room " + enteredCode + ": " + users);
            socket.broadcast.emit('joinedRoom', { description: roomUserMap.get(enteredCode).size + " Players in room " + enteredCode + ": " + users });
            socket.emit('joinedRoom', { description: roomUserMap.get(enteredCode).size + " Players in room " + enteredCode + ": " + users });
         }
      }

   });

})

http.listen(3000, function () {
   console.log('listening on localhost:3000');
});
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

app.get('/gameRoom', function (req, res) {
   res.sendfile('gameRoom.html');
});

var roomno = 1;
var roomCode = null;
var rooms = [];
var roomUserMap = new map();
var userLimitMap = new map();
var randomno = 0;

io.on('connection', function (socket) {

   socket.on('createRoom', function (data) {
      let users = new Set();
 

      if (!data.username) {
         console.log("Admin Invalid username");
         socket.emit('errorCreatingRoom', { description: "Invalid user name...Please enter valid username" });

      } else if (!data.limit) {
         console.log("Invalid user limit");
         socket.emit('errorCreatingRoom', { description: "Invalid user limit...Please enter valid number" });

      } else {
         roomno = Math.floor(1000 + Math.random() * 9000);
         userLimitMap.set(roomno, data.limit);
         socket.id = roomno + data.username;
         rooms.push(roomno);
         socket.join(roomno);
         console.log(randomno);

         users.add(data.username);  //user who creates joins autoomatically
         
         roomUserMap.set(roomno, users);

         socket.emit("roomCreated", { description: "Room " + roomno + " created for " + userLimitMap.get(roomno) + " users", socketId: socket.id });
         console.log("Max no of users for room " + roomno + " is " + userLimitMap.get(roomno));
         console.log("Socket id : " + socket.id);
      }
   });

   socket.on('joinRoom', function (data) {

      users = []
      roomCode = Number(data.code);
      enteredName = data.name;

      if (!roomUserMap.has(roomCode)) {
         console.log("Room code is invalid");
         socket.emit('errorCreatingRoom', { description: "Room code is invalid, please enter valid room code" });
      }
      else if (!enteredName) {
         console.log("Invalid username");
         socket.emit('errorCreatingRoom', { description: "Invalid user name...Please enter valid username" });
      }

      else {

         if (roomUserMap.get(roomCode).has(enteredName)) {
            console.log("Username already present")
            socket.emit('errorJoiningRoom', { description: "The username already exists, please choose another username" });
         }
         else if (roomUserMap.get(roomCode).size == userLimitMap.get(roomCode)) {
            console.log("Room full");
            socket.emit('errorJoiningRoom', { description: "This room is full, please create a new room" });
         }
         else {
            roomUserMap.get(roomCode).add(enteredName);
            users = Array.from(roomUserMap.get(roomCode));
            socket.id = roomCode + enteredName;
            socket.join(roomCode);
            console.log(roomUserMap.get(roomCode).size + " Players in room " + roomCode + ": " + users);
            // socket.in(roomCode).emit('joinedRoom', { description: roomUserMap.get(roomCode).size + " Players in room " + roomCode + ": " + users })
            socket.emit('joinedRoom', { description: roomUserMap.get(roomCode).size + " Players in room " + roomCode + ": " + users, socketId: socket.id });
         }
      }

   });


   socket.on('rollDice', function (data) {
      var roomnum=Number(socket.id.substr(0,4));
      var randomnum;
      randomnum = Math.floor(100000 + Math.random() * 900000);
      console.log(roomnum);
      console.log(socket.id);
      // console.log(randomnum);
      var roomlength=io.adapter.rooms[roomnum];
      console.log(Object.keys(roomlength).length);
      socket.in(roomnum).emit('sampleOutput', { output: randomnum });
      socket.emit('sampleOutput', { output: randomnum });
   });
})

http.listen(3000, function () {
   console.log('listening on localhost:3000');
});

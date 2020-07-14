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
var userTurnMap = new map();
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
         rooms.push(roomno);
         // socket.id=roomno + data.username;
         socket.join(roomno);
         console.log(randomno);

         users.add(data.username);  //user who creates joins autoomatically
         roomUserMap.set(roomno, users);
         userTurnMap.set(roomno,1);
         socket.emit("roomCreated", { description: "Room " + roomno + " created for " + userLimitMap.get(roomno) + " users", page: "<button onclick=" + "'startGame()'" + ">Start Game</button>", room: roomno, order: 1 });
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
            socket.join(roomCode);
            console.log(roomUserMap.get(roomCode).size + " Players in room " + roomCode + ": " + users);
            // socket.in(roomCode).emit('joinedRoom', { description: roomUserMap.get(roomCode).size + " Players in room " + roomCode + ": " + users })
            socket.emit('joinedRoom', { description: roomUserMap.get(roomCode).size + " Players in room " + roomCode + ": " + users, page: "<button onclick=" + "'startGame()'" + ">Start Game</button>", room: roomCode, order: roomUserMap.get(roomCode).size });
         }
      }

   });


   socket.on('rollDice', function (data) {
      // var roomnum=Number(socket.id.substr(0,4));
      var randomnum;
      var users=[];
      var roomnum = Number(data.room);
      var turn=userTurnMap.get(roomnum);
      randomnum = Math.floor(100000 + Math.random() * 900000);
      users=Array.from(roomUserMap.get(roomnum));
      console.log(users);
      if (data.order != turn) {
         socket.emit('errorDice', { description: "It's not your turn , its currently the turn of player " + users[turn-1] });
      }
      else {
         socket.in(roomnum).emit('sampleOutput', { output: randomnum });
         socket.emit('sampleOutput', { output: randomnum });
         console.log(roomnum +"  " +turn);
         turn++;
         userTurnMap.set(roomnum,turn);  
      }
      // console.log(roomnum);
      // console.log(socket.id);
      // console.log(randomnum);
      if(turn>userLimitMap.get(roomnum)){
         userTurnMap.set(roomnum,1);
      }

   });

   socket.on('startingGame',function(data){
      console.log("reached starting game");
      socket.emit('startedGame',{page:"<h1>Transfer Money</h1>\
      <br />\
      <button>Transfer</button>"});
   })
})

http.listen(3000, function () {
   console.log('listening on localhost:3000');
});

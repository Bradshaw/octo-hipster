is_server = true;

mime = require('mime')
  , app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

require("./utility.js");
require("./objects.js");
require("./game.js");
require("./V2.js");
require("./Rect.js");
require("./Bank.js")
require("./Timer.js")
require("./Robot.js");
require("./CivillianRobot.js");
require("./PoliceRobot.js");
require("./gamestate.js");
require("./main.node.js");


updateRate = 1000/10;
dt = updateRate;

gs.switchstate(main);
setInterval(function(){ gs.update(); },(updateRate));


/**
repl = require('repl');
rep = repl.start({
  prompt: "server> ",
  input: process.stdin,
  output: process.stdout,
  useGlobal: true,
  ignoreUndefined: true
});

rep.on('exit', function () {
  console.log('Got "exit" event from repl!');
  process.exit();
});
/**/

io.set('log level',1)

app.listen(1986);

function handler (req, res) {
  var filename = req.url;
  if (filename === '/') {
    filename = '/index.html';
  }
  fs.readFile(__dirname + filename,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Mistakes were made...');
    }
    res.writeHead(200, {'Content-Type': mime.lookup(filename)});
    res.end(data);
  });
}

var x = 0;
nextid = function() {
  return x++;
}

connected = [];

setInterval(function(){

  //! FOREACH player identified by (Socket sock, int id)
  connected.forEach(function(sock, id)
  {
    //! FOREACH robot in the game identified by (Robot bot, int dd)
    G.robots.forEach(function(bot, dd)
    {
      sock.emit('update', 
      {
        pos: {x:Math.round(bot.position.x), y:Math.round(bot.position.y)},
        mov: {x:Math.round(bot.movement.x*10), y:Math.round(bot.movement.y*10)},
        id: dd,
        interact: (bot.interactPeer==null) ? -1 : bot.interactPeer.id
      });
      
    });
    
    if (G.robots[id] && G.robots[id].humanPlayer && G.robots[id].robotTeam)
    {
    	var distance = (G.robots[id]?Math.sqrt(G.robots[id].nearestHUMAN_dist2):Infinity);
//    	console.log(distance); // quand distance est aux alentours de 20-30 mettre vol à 1 (~collision)
	    var vol = 1 - Math.min(1, Math.max(0,((distance - 20)/150))); // coeficient pour le volume à ajuster en fonction marche pas pour l'instant
	    console.log("vol dans serveur"+vol);
		sock.emit('heartbeat',{vol: vol}); // ne met pas à jour heartbeat il y a pas un truc speciale pour envoyer au bon ?
	}

  });
},100);

setInterval(function(){
  connected.forEach(function(sock, id){
    sock.get('challenge',function(err,data){
      if (data && data){
        sock.disconnect()
      } else {
        sock.emit('ping');
        sock.set('challenge',true)
      }
    })

  });
},2000);



io.sockets.on('connection', function (socket) {
  socket.set('challenge',false)
  // Add a player to the game
  var id = nextid();
  var pos = new V2();
  G.level.playable_area.randomWithin(pos);
  var r = (id%2==0?
              new PoliceRobot(pos):
              new Robot(pos));
  r.humanPlayer = true;
  r.robotTeam = id%2!=0
  connected.forEach(function(sock){
    sock.emit('newBot',{bot: r.position, id: id, vis: r.visual});
  });
  connected[id]=socket;
  socket.set('id',id);
  G.addRobot(id, r);
  G.robots.forEach(function(bot, id){
    socket.emit('newBot',{bot: bot.position, id: id, vis: bot.visual});
  })


  socket.on('pong',function(data){
    if (data.id==id){
      socket.set('challenge',false);
    } else {
      socket.disconnect();
    }
  })

  socket.on('disconnect',function(){
    delete G.robots[id];
    socket.get('id', function(err, dd){
      connected.forEach(function(sock){
        sock.emit('leave',{id: dd});
      });
    });
  })

  socket.on("move", function(data){
    socket.get('id', function(err, dd){
      G.robots[dd].move(data.x, data.y);
    });
  });
  socket.emit('you', {id: id});

	socket.emit("hello");
});

is_server = true;

mime = require('mime')
  , app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

require("./game/utility.js");
require("./game/objects.js");
require("./game/game.js");
require("./game/V2.js");
require("./game/Rect.js");
require("./game/Bank.js")
require("./game/Timer.js")
require("./game/Robot.js");
require("./game/RobotCivillian.js");
require("./game/RobotCivillian.js");
require("./game/RobotImposter.js");
require("./game/gamestate.js");

//require("lobby.node.js");
require("./main.node.js");


updateRate = 1000/10;
dt = updateRate;
round = 1;

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

gameOn = false;

function handler (req, res) 
{
  var filename = req.url;
  if (filename === '/') 
  {
    filename = '/index.html';
  }
  fs.readFile(__dirname + filename,
  function (err, data) 
  {
    if (err) 
    {
      res.writeHead(500);
      return res.end('Mistakes were made...');
    }
    res.writeHead(200, {'Content-Type': mime.lookup(filename)});
    res.end(data);
  });
}

var x = 0;
nextid = function() 
{
  return x++;
}

connected = [];

setInterval(function()
{
  nbPlayers = 0;
  
  //! FOREACH player identified by (Socket sock, int id)
  connected.forEach(function(sock, id)
  {
    nbPlayers++;
    //! FOREACH robot in the game identified by (Robot bot, int dd)
    G.robots.forEach(function(bot, dd)
    {
      sock.emit('synch', 
      {
        pos: {x: Math.round(bot.position.x), y:Math.round(bot.position.y)},
        mov: {x: Math.round(bot.movement.x*10), y:Math.round(bot.movement.y*10)},
        id: dd,
        interact: (bot.interactPeer == null) ? -1 : bot.interactPeer.id,
        dead: bot.dead
      });
      
    });
    
    var distance = Infinity;
    if (G.robots[id]!=null && G.robots[id].robotTeam)
    {
      distance = (G.robots[id]?Math.sqrt(G.robots[id].nearestHuman.dist2):Infinity);
    } 
    else 
    {
      distance = (G.robots[id]?Math.sqrt(G.robots[id].nearestCop.dist2):Infinity);
    }
    var vol = 1 - Math.min(   1,      Math.max( 0, ((distance - 20)/300)   )       );
    sock.emit('heartbeat',{vol: Math.floor(vol*100)});

  });

  gameOn = nbPlayers > 1;
},100);

//! ----------------------------------------------------------------------------
//! 'CHALLENGE' EVERY 2 SECONDS (BOOT IF NON-RESPONSIVE)
//! ----------------------------------------------------------------------------
setInterval(function()
{
  connected.forEach(function(sock, id)
  {
    sock.get('challenge',function(err,data)
    {
      if (data && data)
      {
        sock.disconnect()
      } 
      else 
      {
        sock.emit('ping');
        sock.set('challenge',true)
      }
    })

  });
},2000);

score = 0

//! ----------------------------------------------------------------------------
//! ADD NEW PLAYER TO THE GAME ON CONNECTION
//! ----------------------------------------------------------------------------

io.sockets.on('connection', function (socket) 
{
  socket.set('challenge', false)
  
  // generate unique id
  var id = nextid();
  
  // generate random position
  var pos = new V2();
  G.level.playable_area.randomWithin(pos);
  
  // create robot
  var robotTeam = false; //FIXME (id % 2 == 0);
  var r = robotTeam ? new PoliceRobot(pos): new Robot(pos);
  r.humanControlled = true;
  r.robotTeam = robotTeam;
  
  // intialise secret (server-only) attributes
  r.initSecret();
  
  connected.forEach(function(sock)
  {
    sock.emit('newBot',{bot: r.position, id: id, vis: r.visual});
  });
  connected[id]=socket;
  socket.set('id',id);
  G.addRobot(id, r);
  G.robots.forEach(function(bot, id)
  {
    socket.emit('newBot', {bot: bot.position, id: id, vis: bot.visual});
  })


  socket.on('pong',function(data){
    if (data.id == id)
    {
      socket.set('challenge',false);
    } 
    else 
    {
      socket.disconnect();
    }
  })

  socket.on('disconnect',function()
  {
    delete G.robots[id];
    socket.get('id', function(err, dd)
    {
      connected.forEach(function(sock)
      {
        sock.emit('leave',{id: dd});
      });
    });
  })

  socket.on('synch', function(data)
  {
    socket.get('id', function(err, dd)
    {
      var bot = G.robots[dd];
      if (dd) {
        // SET MOVEMENT
        bot.move(data.x, data.y);
        
        // SET INTERACTION (if applicable)
        if (data.intid != -1)
        {
          var v = new V2().setV2(bot.position);
          var r = G.robots[data.intid];
          if (r && !(r.humanControlled && r.robotTeam))
          {
            if (v.dist2(r.position) < MAX_INTERACT_DISTANCE2)
            {
              bot.tryInteractPeer(r);
            }
          }
        }
        else 
        {
          bot.tryInteractPeer(null);
        }
      }
    });
  });
  socket.emit('you', {id: id});
});

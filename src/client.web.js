var is_server = false;


var meSelector = load_image("images/cercle.png")
var arrowSelector = load_image("images/fleche.png")

G = new game();

//var coeur = load_audio("Battements_coeur.ogg");

var socket = io.connect(location.origin);
socket.on('load',function(data){
  if (data.callback)
    loadScript(data.url, data.callback);
  else
    loadScript(data.url);
});

socket.on('hello',function(data) {
  console.log('Helloed');
});
id = -1;
socket.on('you',function(data) {
  id = data.id;
});


$('body').bind('beforeunload',function(){
  alert("Cool");
  socket.send("leaving");
});

socket.on('leave',function(data){
  delete G.robots[data.id];
});

socket.on('heartbeat',function(data){
    console.log("conard"); //pas afficher
    console.log(VolumeSample);
	VolumeSample.source[0].noteOn(0); // warrning car ne VolumeSample n'est pas creer la première fois
	VolumeSample.source[0].loop = true;
	changeVolume(VolumeSample.gainNode[0],data.vol); 	

});

socket.on('ping',function(data){
  socket.emit('pong',{id: id});
});

socket.on('update',function(data) {
  var bot = G.robots[data.id];

  if (bot) 
  {
    // move
    var dx = ( ((data.pos.x - bot.position.x)/5) + data.mov.x)*2;
    var dy = ( ((data.pos.y - bot.position.y)/5) + data.mov.y)*2;
    bot.movement.setXY(dx, dy);
    bot.animdirection.setXY(data.mov.x,data.mov.y);
    
    // interaction
    bot.tryInteractPeer((data.interact == -1) ? null : G.robots[data.interact]);
  }
});

socket.on('newBot',function(data) {
  var b = (data.vis==4?
                new PoliceRobot(new V2(data.bot.x,data.bot.y)):
                new Robot(new V2(data.bot.x,data.bot.y),data.vis));
  G.addRobot(data.id, b);
})

var updateRate = 1000/60;
var dt = updateRate/60;


gs.switchstate(main);
setInterval(function(){
    gs.update();
  },(updateRate));

setInterval(function(){
    var dx = keyboard.direction.x;
    var dy = keyboard.direction.y;
    if (id>=0) {
      socket.emit('move', {
        x: Math.round(dx),
        y: Math.round(dy)
      });
    }
  },100);

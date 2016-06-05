var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var connections = [];
var players = [];
var orbs = [];
var scoreboard = [];
var defaultSpeed = 4;
var defaultSize = 6;
var defaultzoom = 1.5;
var defaultOrbs = 1000;
var worldWidth = 5000;
var worldHeight = 5000;
var tock;


server.listen(process.env.port || 3333);
console.log('server running on port 3333');

app.use(express.static(__dirname + '/../client'));

// BEGIN SOCKETS
io.sockets.on("connect", function(socket){
	if(connections == 0){
		initGame();
		console.log("New Field");
	}
	newPlayer();
	function newPlayer(){
		players.push(new Player());
		socket.emit("init",{
			init: players[players.length-1],
			orbs: orbs,
			players: players
		});
	}
	function Player(){
		this.id = (socket.id).substring(2);
		this.locX = Math.floor((Math.random()*worldWidth) + 10); 
		this.locY = Math.floor((Math.random()*worldHeight) + 10);
		this.speed = defaultSpeed;
		this.radius = defaultSize;
		this.color = getRandomColor();
		this.zoom = defaultzoom;
		this.xVector = 0;
		this.yVector = 0;
		this.worldWidth = worldWidth;
		this.worldHeight = worldHeight;
	}

	socket.on("tick", function(data){
		movePlayer(data.player);
		function movePlayer(player){
			if(((player.locX < 5 && player.xVector < 0) || (player.locX > player.worldWidth) && (player.xVector > 0)) && ((player.locY < 5 && player.yVector > 0) || (player.locY > player.worldHeight) && (player.yVector < 0))){
				console.log("can't move X or Y");
			}else if((player.locX < 5 && player.xVector < 0) || (player.locX > player.worldWidth) && (player.xVector > 0)){
				player.locY -= player.speed * player.yVector;
				console.log("cant move X");
			}else if((player.locY < 5 && player.yVector > 0) || (player.locY > player.worldHeight) && (player.yVector < 0)){
				player.locX += player.speed * player.xVector;
				console.log("cant move Y");
			}else{
				player.locX += player.speed * player.xVector;
				player.locY -= player.speed * player.yVector;
			}
			for(var i = 0; i < players.length; i++){
				if(players[i].id == player.id){
					players[i].locX = player.locX;
					players[i].locY = player.locY;
				}
			}
		socket.emit("tock",{
			players: players,
			x: player.locX,
			y: player.locY
		});
		checkForCollisions();
		}
	})
	
	function checkForCollisions(){
		for(var i = 0; i < players.length; i++){
			for(var j = 0; j < orbs.length; j++){
			// AABB Test(square)
				if(players[i].locX + players[i].radius + orbs[j].radius > orbs[j].locX 
					&& players[i].locX < orbs[j].locX + players[i].radius + orbs[j].radius
					&& players[i].locY + players[i].radius + orbs[j].radius > orbs[j].locY 
					&& players[i].locY < orbs[j].locY + players[i].radius + orbs[j].radius){
				// Pythagoras test(cricle)
						distance = Math.sqrt(
							((players[i].locX - orbs[j].locX) * (players[i].locX - orbs[j].locX)) + 
							((players[i].locY - orbs[j].locY) * (players[i].locY - orbs[j].locY))	
							);
						if(distance < players[i].radius + orbs[j].radius){
							players[i].color = orbs[j].color;
							if(i == 0 && players[i].zoom > 1){
								players[i].zoom -= .001;
							}
							orbs.splice(j, 1);
							players[i].radius += 0.25;
							if(players[i].speed < -0.005){
								players[i].speed += 0.005;
							}else if(players[i].speed > 0.005){
								players[i].speed -= 0.005;
							}
							if(orbs.length < defaultOrbs){
								createOrbs(1);
							}
							socket.emit("collision",{
								players: players,
								orbs: orbs
							});
						}
				}
			}
			// for(var k = 0; k < players.length; k++){
			// 	if(players[i] != players[k]){
			// 	// AABB Test
			// 		if(players[i].locX + players[i].radius + players[k].radius > players[k].locX 
			// 		&& players[i].locX < players[k].locX + players[i].radius + players[k].radius
			// 		&& players[i].locY + players[i].radius + players[k].radius > players[k].locY 
			// 		&& players[i].locY < players[k].locY + players[i].radius + players[k].radius){
			// 	// Pythagoras test
			// 			distance = Math.sqrt(
			// 				((players[i].locX - players[k].locX) * (players[i].locX - players[k].locX)) + 
			// 				((players[i].locY - players[k].locY) * (players[i].locY - players[k].locY))	
			// 				);
			// 			if(distance < players[i].radius + players[k].radius){
			// 				if(players[i].radius > players[k].radius){
			// 			// BOT DEATH
			// 					socket.emit("message_to_server", {
			// 						message: "Bot Killed",
			// 						id: k,
			// 						killedBy: i,
			// 						radius: players[k].radius
			// 					});
			// 					players[i].radius += (players[k].radius * 0.25)
			// 					if(i == 0){
			// 						player.zoom -= (players[k].radius * 0.25) * .001;
			// 					}
			// 					players.splice(k, 1);
			// 				}else if(players[i].radius < players[k].radius){
			// 			// Player DEATH
			// 					socket.emit("message_to_server", {
			// 						message: "PLAYER DEATH",
			// 						id: i,
			// 						killedBy: k,
			// 						radius: players[i].radius
			// 					});								
			// 					players[k].radius += (players[i].radius * 0.25)
			// 					player.zoom -= (players[i].radius * 0.25) * .01;
			// 					players.splice(i, 1)
			// 				}
			// 			}
			// 		}
			// 	}
			// }
		}
	}

	// connections.push(socket);
	console.log('Connected: %s sockets connected', players.length);

	socket.on("message_to_server", function(data){
		console.log(data);
		io.sockets.emit("message_to_client",{
			message: "Message Recieved, player " + data.id + " killed by player " + data.killedBy + " when he had radius of " + data.radius + "."  
		});
	});

	socket.on('disconnect', function(data){
		// connections.splice(connections.indexOf(socket), 1);
		for(var i = 0; i < players.length; i++){
			if(players[i].id == (socket.id).substring(2)){
				players.splice(i, 1);
			}
		}
		console.log('Disconnected: %s sockets connected', players.length);
	});	

// END SOCKETS	
});

// Starting a new game
function initGame(){
	orbs = [];
	createOrbs(defaultOrbs);
}

function createOrbs(num){
	for(var i = 0; i < num; i++){
		orbs.push(new Orb());
	}
}

function Orb(){
	this.color = getRandomColor();
	this.locX = Math.floor((Math.random()*worldWidth) + 10); 
	this.locY = Math.floor((Math.random()*worldHeight) + 10);
	this.radius = 5;
}

function getRandomColor(){
	var r = Math.floor((Math.random()*206)+50),
		g = Math.floor((Math.random()*206)+50),
		b = Math.floor((Math.random()*206)+50);
	return "rgb(" + r + "," + g + "," + b + ")";
}


var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
global.connections = [];
var teams = [];
var players = [];
var orbs = [];
var scoreboard = [];
var defaultSpeed = 6;
var defaultSize = 6;
var defaultzoom = 1.5;
var defaultOrbs = 1000;
var worldWidth = 5000;
var worldHeight = 5000;
var tock;
var routes = require('./routes/index');
var bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);



server.listen(process.env.port || 3333);
console.log('server running on port 3333');

app.use(express.static(__dirname + '/../client'));

// BEGIN SOCKETS
io.sockets.on("connect", function(socket){
	if(connections == 0){
		initGame();
		console.log("New Field");
	}

	connections.push(socket);
	console.log('Connected: %s sockets connected', connections.length);
//Disconnect
	socket.on('disconnect', function(data){
		for(var i = 0; i < players.length; i++){
			if(players[i].id == socket.conn.id){				
				players.splice(i, 1);
			}
		}
		connections.splice(connections.indexOf(socket), 1);
		console.log('Disconnected: %s sockets connected', connections.length);
	});	

	socket.on("getTeams", function(data){
		console.log(data.playerName + " is looking for teams.")
		io.sockets.emit("returnTeams", {
			teams: teams
		});
	});

	socket.on("makeTeam", function(data){
		console.log(data.playerName + " makeing " + data.teamName + " team.");
		teams.push({
					name: data.teamName,
					players: []
					});
		io.sockets.emit("returnTeams", {
			teams: teams
		})
	});

	socket.on("init", function(data){
		newPlayer(data.playerName, data.team);
	});

	function newPlayer(playerName, team){
		players.push(new Player(playerName, team));
		if(team !== false){
			teams[team].players.push(players[players.length-1]);
		}
		socket.emit("init_return",{
			init: players[players.length-1],
			orbs: orbs,
			players: players
		});
	}
	function Player(playerName, team){
		this.id = socket.conn.id;
		this.name = playerName;
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
		this.team = team;
		this.alive = true;
		this.score = 0;
		this.orbsAbsorbed = 0;
		this.playersAbsorbed = 0;
	}

	socket.on("tick", function(data){
		for(var i = 0; i < players.length; i++){
			if(players[i].id == data.playerID){
				player = players[i];
				player.xVector = data.playerXVector;
				player.yVector = data.playerYVector;
			}
		}
		if(player.alive){
			movePlayer();
			function movePlayer(){
				if(((player.locX < 5 && player.xVector < 0) || (player.locX > player.worldWidth) && (player.xVector > 0)) && ((player.locY < 5 && player.yVector > 0) || (player.locY > player.worldHeight) && (player.yVector < 0))){
				}else if((player.locX < 5 && player.xVector < 0) || (player.locX > player.worldWidth) && (player.xVector > 0)){
					player.locY -= player.speed * player.yVector;
				}else if((player.locY < 5 && player.yVector > 0) || (player.locY > player.worldHeight) && (player.yVector < 0)){
					player.locX += player.speed * player.xVector;
				}else{
					player.locX += player.speed * player.xVector;
					player.locY -= player.speed * player.yVector;
				}
				
			checkForCollisions();
			}
		}
	});
	
	function checkForCollisions(){
	//ORB COLLISIONS
		for(var j = 0; j < orbs.length; j++){
		// AABB Test(square)
			if(player.locX + player.radius + orbs[j].radius > orbs[j].locX 
				&& player.locX < orbs[j].locX + player.radius + orbs[j].radius
				&& player.locY + player.radius + orbs[j].radius > orbs[j].locY 
				&& player.locY < orbs[j].locY + player.radius + orbs[j].radius){
			// Pythagoras test(cricle)
					distance = Math.sqrt(
						((player.locX - orbs[j].locX) * (player.locX - orbs[j].locX)) + 
						((player.locY - orbs[j].locY) * (player.locY - orbs[j].locY))	
						);
					if(distance < player.radius + orbs[j].radius){
				//COLLISION!!!
						player.score += 1;
						player.orbsAbsorbed += 1;
						player.color = orbs[j].color;
						if(player.zoom > 1){
							player.zoom -= .001;
						}
						orbs.splice(j, 1);
						player.radius += 0.25;
						if(player.speed < -0.005){
							player.speed += 0.005;
						}else if(player.speed > 0.005){
							player.speed -= 0.005;
						}
						if(orbs.length < defaultOrbs){
							createOrbs(1);
						}
					}
			}
		}
	//PLAYER COLLISIONS	
			for(var k = 0; k < players.length; k++){
				if(player.id != players[k].id){
				// AABB Test
					if(player.locX + player.radius + players[k].radius > players[k].locX 
					&& player.locX < players[k].locX + player.radius + players[k].radius
					&& player.locY + player.radius + players[k].radius > players[k].locY 
					&& player.locY < players[k].locY + player.radius + players[k].radius){
				// Pythagoras test
						distance = Math.sqrt(
							((player.locX - players[k].locX) * (player.locX - players[k].locX)) + 
							((player.locY - players[k].locY) * (player.locY - players[k].locY))	
							);
						if(distance < player.radius + players[k].radius){
					//COLLISION!!
							if(player.radius > players[k].radius){
						// ENEMY DEATH
								player.score += (players[k].score + 10);
								player.playersAbsorbed += 1;
								players[k].alive = false;
								io.sockets.emit("death", {
									message: "Player Killed",
									died: players[k],
									killedBy: player.name,
								});
								player.radius += (players[k].radius * 0.25)
								if(player.zoom > 1){
									player.zoom -= (players[k].radius * 0.25) * .001;
								}
								players.splice(k, 1);
							}else if(player.radius < players[k].radius){
						// Player DEATH
								players[k].score += (player.score + 10);
								players[k].playersAbsorbed += 1;
								player.alive = false;
								io.sockets.emit("death", {
									message: "PLAYER DEATH",
									died: player,
									killedBy: players[k].name,
								});								
								players[k].radius += (player.radius * 0.25)
								player.zoom -= (player.radius * 0.25) * .01;
								for(var i = 0; i < players.length; i++){
									if(players[i].id == player.id){
										players.splice(i, 1);
									}
								}
							}
						}
					}
				}
			}
		for(var i = 0; i < players.length; i++){
			if(players[i].id == player.id){
				players[i] = player;
				socket.emit("tock",{
					players: players,
					orbs: orbs,
					player: player
				});
			}
		}
	}



// END SOCKETS	
});

// Starting a new game
function initGame(){
	players = [];
	teams = [];
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
	this.locX = Math.floor(Math.random()*worldWidth); 
	this.locY = Math.floor(Math.random()*worldHeight);
	this.radius = 5;
}

function getRandomColor(){
	var r = Math.floor((Math.random()*206)+50),
		g = Math.floor((Math.random()*206)+50),
		b = Math.floor((Math.random()*206)+50);
	return "rgb(" + r + "," + g + "," + b + ")";
}

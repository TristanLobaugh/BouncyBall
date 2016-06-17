var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
global.connections = [];
var teams = [];
var players = [];
var orbs = [];
var bases = [];
var scoreboard = [];
var defaultSpeed = 3;
var defaultSize = 8;
var defaultzoom = 1.5;
var defaultOrbs = 1000;
var defaultBases = 3;
var worldWidth = 5000;
var worldHeight = 5000;
var scoreToWin = 500;
var tock;
var basesEmit;
var tockActive = false;
var routes = require('./routes/index');
var bodyParser = require('body-parser');
var tockInterval;
var clockInterval;
var fps = 1000 / 60;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);



server.listen(process.env.port || 3333);
console.log('server running on port 3333');

app.use(express.static(__dirname + '/../client'));

// BEGIN SOCKETS
io.sockets.on("connect", function(socket) {
    if (connections == 0) {
        initGame();
        tockActive = true;
        tockInterval = setInterval(function() {
            tock();
        }, fps);
        clockInterval = setInterval(function() {
            clock();
        }, 1000);
        console.log("New Field");
    }

    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);
//Disconnect
    socket.on('disconnect', function(data) {
        for (var i = 0; i < players.length; i++){
            if(players[i].id == socket.conn.id){
            	if(players[i].team !== false){
            		for(var j = 0; j < teams[players[i].team].players.length; j++){
            			if(teams[players[i].team].players[j].id == players[i].id){
            				teams[players[i].team].players.splice(j, 1);
            			}
            		}
            		if(teams[players[i].team].players.length < 1){
            			teams.splice(players[i].team, 1);
            		}
            	}
                players.splice(i, 1);
            }
        }
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected: %s sockets connected', connections.length);
        if (connections.length == 0) {
            tockActive = false;
            clearInterval(tockInterval);
            clearInterval(clockInterval);
        }
    });

    socket.on("getTeams", function(data) {
        console.log(data.playerName + " is looking for teams.")
        io.sockets.emit("returnTeams", {
            teams: teams
        });
    });

    socket.on("makeTeam", function(data) {
        console.log(data.playerName + " makeing " + data.teamName + " team.");
        teams.push({
            name: data.teamName,
            players: [],
            teamScore: 0
        });
        io.sockets.emit("returnTeams", {
            teams: teams
        })
    });

    socket.on("init", function(data) {
    	if(tockActive === false){
    		tockActive = true;
	        tockInterval = setInterval(function() {
	            tock();
	        }, fps);
	        clockInterval = setInterval(function() {
	            clock();
	        }, 1000);    		
    	}
        newPlayer(data.playerName, data.team);
    });

    function initReturn(playerToReturn) {
        socket.emit("init_return", {
            init: playerToReturn,
            orbs: orbs,
            players: players,
            bases: bases
        });
    }

    function newPlayer(playerName, team) {
        players.push(new Player(playerName, team));
        initReturn(players[players.length - 1]);
        if (team !== false) {
// CAN MAKE THIS BETTER
            teams[team].players.push(players[players.length - 1]);
            io.sockets.emit("join", {
                playerName: playerName,
                teamName: teams[team].name
            });
        } else {
            io.sockets.emit("join", {
                playerName: playerName,
                teamName: team
            });
        }
    }

    function Player(playerName, team) {
        this.id = socket.conn.id;
        this.name = playerName;
        this.locX = Math.floor((Math.random() * (worldWidth - 20)) + 10);
        this.locY = Math.floor((Math.random() * (worldHeight - 20)) + 10);
        this.speed = defaultSpeed;
        this.radius = defaultSize;
        this.color = getRandomColor();
        this.zoom = defaultzoom;
        this.xVector = 0;
        this.yVector = 0;
        this.action = false;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.team = team;
        this.alive = true;
        this.score = 0;
        this.orbsAbsorbed = 0;
        this.playersAbsorbed = 0;
        if (team !== false) {
            this.inGame = true
        }
    }

    socket.on("respawn", function(data) {
        console.log("respawning");
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == data.playerID) {
                players[i].locX = Math.floor((Math.random() * (worldWidth - 20)) + 10);
                players[i].locY = Math.floor((Math.random() * (worldHeight - 20)) + 10);
                players[i].speed = defaultSpeed;
                players[i].radius = defaultSize;
                players[i].color = getRandomColor();
                players[i].zoom = defaultzoom;
                players[i].xVector = 0;
                players[i].yVector = 0;
                players[i].action = false;
                players[i].alive = true;
                initReturn(players[i]);
            }
        }
    });

    socket.on("leaveTeam", function(data){
		playerTeam = data.player.team;
		for(var i = 0; i < teams[playerTeam].players.length; i++){
			if(teams[playerTeam].players[i].id == data.player.id){
				teams[playerTeam].players.splice(i, 1);
			}
		}
		if(teams[playerTeam].players.length < 1){
			teams.splice(playerTeam, 1);
		}
		for(var j = 0; j < players.length; j++){
			if(players[j].id == data.player.id){
				players.splice(j, 1);
			}
		}
    });

    socket.on("tick", function(data) {
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == data.playerID) {
                player = players[i];
                player.xVector = data.playerXVector;
                player.yVector = data.playerYVector;
                player.action = data.playerAction;
            }
        }
        if (player.alive) {
            movePlayer();

            function movePlayer() {
                if (((player.locX < 5 && player.xVector < 0) || (player.locX > player.worldWidth) && (player.xVector > 0)) && ((player.locY < 5 && player.yVector > 0) || (player.locY > player.worldHeight) && (player.yVector < 0))) {} else if ((player.locX < 5 && player.xVector < 0) || (player.locX > player.worldWidth) && (player.xVector > 0)) {
                    player.locY -= player.speed * player.yVector;
                } else if ((player.locY < 5 && player.yVector > 0) || (player.locY > player.worldHeight) && (player.yVector < 0)) {
                    player.locX += player.speed * player.xVector;
                } else {
                    player.locX += player.speed * player.xVector;
                    player.locY -= player.speed * player.yVector;
                }

                checkForCollisions();
            }
        }
    });

    function checkForCollisions() {
        //ORB COLLISIONS
        for (var j = 0; j < orbs.length; j++) {
            // AABB Test(square)
            if (player.locX + player.radius + orbs[j].radius > orbs[j].locX && player.locX < orbs[j].locX + player.radius + orbs[j].radius && player.locY + player.radius + orbs[j].radius > orbs[j].locY && player.locY < orbs[j].locY + player.radius + orbs[j].radius) {
                // Pythagoras test(cricle)
                distance = Math.sqrt(
                    ((player.locX - orbs[j].locX) * (player.locX - orbs[j].locX)) +
                    ((player.locY - orbs[j].locY) * (player.locY - orbs[j].locY))
                );
                if (distance < player.radius + orbs[j].radius) {
                    //COLLISION!!!
                    player.score += 1;
                    player.orbsAbsorbed += 1;
                    player.color = orbs[j].color;
                    if (player.zoom > 1) {
                        player.zoom -= 0.001;
                    }
                    orbs.splice(j, 1);
                    player.radius += 0.25;
                    if (player.speed < -0.005) {
                        player.speed += 0.005;
                    } else if (player.speed > 0.005) {
                        player.speed -= 0.005;
                    }
                    if (orbs.length < defaultOrbs) {
                        createOrbs(1);
                    }
                    io.sockets.emit("orbs", {
                        orbs: orbs
                    });
                }
            }
        }

        //BASE COLLISIONS
        for (var i = 0; i < bases.length; i++) {
            if (player.action == "feed" && player.team !== false && player.radius > defaultSize) {
                // AABB Test
                if (player.locX + player.radius + 47 > bases[i].locX && player.locX < bases[i].locX + player.radius + 47 && player.locY + player.radius + 47 > bases[i].locY && player.locY < bases[i].locY + player.radius + 47) {
                // Pythagoras test
                    distance = Math.sqrt(
                        ((player.locX - bases[i].locX) * (player.locX - bases[i].locX)) +
                        ((player.locY - bases[i].locY) * (player.locY - bases[i].locY))
                    );
                    if (distance < player.radius + 47) {
                //COLLISION
                        player.radius -= 0.125;
                        teams[player.team].teamScore += 0.5;
                //WIN CHECK
                        if(teams[player.team].teamScore >= scoreToWin){
                //WIN!!!
                			win(teams[player.team]);	
                        }
                        if (player.speed < defaultSpeed) {
                            player.speed += 0.0025;
                        }
                        if (player.zoom < defaultzoom) {
                            player.zoom += 0.0005
                        }
                    }
                }
            }
        }

        //PLAYER COLLISIONS	
        for (var k = 0; k < players.length; k++) {
            if (player.id != players[k].id && players[k].alive === true) {
                if ((players[k].team !== player.team) || ((players[k].team === player.team) && (player.action == "feed") && (player.radius > players[k].radius) && (player.radius > defaultSize)) || (player.team === false)) {
                    // AABB Test
                    if (player.locX + player.radius + players[k].radius > players[k].locX && player.locX < players[k].locX + player.radius + players[k].radius && player.locY + player.radius + players[k].radius > players[k].locY && player.locY < players[k].locY + player.radius + players[k].radius) {
                        // Pythagoras test
                        distance = Math.sqrt(
                            ((player.locX - players[k].locX) * (player.locX - players[k].locX)) +
                            ((player.locY - players[k].locY) * (player.locY - players[k].locY))
                        );
                        console.log("collision check");
                        if (distance < (player.radius + players[k].radius)) {
                            //COLLISION!!
                            if ((player.radius > players[k].radius && players[k].team !== player.team) || (player.radius > players[k].radius && player.team === false)) {
                                // ENEMY DEATH
                                player.score += (players[k].score + 10);
                                player.playersAbsorbed += 1;
                                players[k].alive = false;
                                io.sockets.emit("death", {
                                    message: "Player Killed",
                                    died: players[k],
                                    killedBy: player.name
                                });
                                player.radius += (players[k].radius * 0.25);
                                if (player.zoom > 1){
                                    player.zoom -= (players[k].radius * 0.25) * 0.001;
                                }
                                if (players[k].team === false) {
                                    players.splice(k, 1);
                                }
                            } else if ((player.radius < players[k].radius && players[k].team !== player.team) || (player.radius < players[k].radius && player.team === false)) {
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
                                for (var i = 0; i < players.length; i++) {
                                    if (players[i].id == player.id && players[i].team === false) {
                                        players.splice(i, 1);
                                    }
                                }
                            } else {
                                player.radius -= 0.125;
                                if (player.speed < defaultSpeed) {
                                    player.speed += 0.0025;
                                }
                                if (player.zoom < defaultzoom) {
                                    console.log("line 277");
                                    player.zoom += 0.0005
                                }
                                players[k].radius += 0.125;
                                if (players[k].speed > 0.005) {
                                    player.speed -= 0.0025;
                                }
                                if (players[k].zoom > 1) {
                                    players[k].zoom -= 0.0005;
                                }
                            }
                        }
                    }
                }
            }
        }
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == player.id) {
                players[i] = player;
            }
        }
    }

    function tock() {
        io.sockets.emit("tock", {
            players: players,
            teams: teams
        });
    }

    function clock() {
        for (var i = 0; i < bases.length; i++) {
            bases[i].timeBeforeMove--;
            if (bases[i].timeBeforeMove <= 0) {
                bases[i].locX = (Math.floor(Math.random() * (worldWidth - 200)) + 100);
                bases[i].locY = (Math.floor(Math.random() * (worldHeight - 200)) + 100);
                bases[i].timeBeforeMove = (Math.floor(Math.random() * 60) + 60);
                io.sockets.emit("bases", {
		            bases: bases
		        });
            }
        }
    }

    function win(winningTeam){
    	clearInterval(tockInterval);
        clearInterval(clockInterval);
        tockActive = false;
    	for(var i = 0; i < players.length; i++){
    		players[i].alive = false;
			players[i].team = false;
			players[i].inGame = false;
    	}
    	io.sockets.emit("win", {
    		winningTeam: winningTeam,
    		players: players,
    		teams: teams
    	});
    	initGame();
    }

    // END SOCKETS	
});

// Starting a new game
function initGame() {
    players = [];
    teams = [];
    orbs = [];
    bases = [];
    createOrbs(defaultOrbs);
    createBases(defaultBases);
}

function createOrbs(num) {
    for (var i = 0; i < num; i++) {
        orbs.push(new Orb());
    }
}

function Orb() {
    this.color = getRandomColor();
    this.locX = Math.floor(Math.random() * worldWidth);
    this.locY = Math.floor(Math.random() * worldHeight);
    this.radius = 5;
}

function createBases(num) {
    for (var i = 0; i < num; i++) {
        bases.push(new Base());
    }
}

function Base() {
    this.locX = (Math.floor(Math.random() * (worldWidth - 200)) + 100);
    this.locY = (Math.floor(Math.random() * (worldHeight - 200)) + 100);
    this.timeBeforeMove = (Math.floor(Math.random() * 60) + 60);
}

function getRandomColor() {
    var r = Math.floor((Math.random() * 206) + 50),
        g = Math.floor((Math.random() * 206) + 50),
        b = Math.floor((Math.random() * 206) + 50);
    return "rgb(" + r + "," + g + "," + b + ")";
}

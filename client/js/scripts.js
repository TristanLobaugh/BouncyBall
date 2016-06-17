var app = angular.module("orbApp", []);
app.controller("orbController", function($scope, $http){
	var player = {};
	var keysDown = [];
	var playerAction = false;
	var orbs;
	var players;
	var bases;
	var wHeight = $(window).height();
	var wWidth = $(window).width();
	var tickInterval;
	var leaderInterval;
	var fps = 1000/60;
	var base = new Image();
	base.src = "img/base.png";
// FOR AWS
	// var apiPath = "http://orb-blitz.tristanlobaugh.com/";
	// var apiPath = "http://localhost:3333/api/";
	var apiPath = "http://tristanlobaugh.com:3333/";

	var canvas = document.getElementById("the-canvas");
	var context = canvas.getContext("2d");
	canvas.width = wWidth;
	canvas.height = wHeight;

	var socket = io.connect("http://174.129.90.83:3333");

	$scope.score = 0;
	$scope.scoreToWin = 500;
	$scope.sortOrder = "-score";
	$scope.sortStatBy = "-highScore";
	$scope.errorMessage = false;
	$scope.sortTeams = false;
	$scope.onTeam = false;
	$scope.endGame = false;

	$(window).load(function(){
		$("#loginModal").modal("show");
		// $("#deathModal").modal("show");
	});

//API CALLS
	$scope.login = function(event){
		$http.post(apiPath + "login",{
			socketID: socket.id,
			userName: $scope.playerName,
			playerPassword: $scope.playerPassword
		}).then(function successCallback(response){
			if(response.data.success == "found"){
				$scope.errorMessage = false;
				player.name = $scope.playerName;
				$(".modal").modal("hide");
				$("#spawnModal").modal("show");
			}else if(response.data.failure == "noUser" || response.data.failure == "badPassword"){
				$scope.errorMessage = "Your user name or password is incorrect. Please try again";
			}else if(response.data.failure == "loggedIn"){
				$scope.errorMessage = "Sorry, this user is already logged in.";
			}
		}, function errorCallback(response){
				console.log(response.status);
		});
	}

	$scope.gotoCreate = function(){
		$scope.errorMessage = false;
		$(".modal").modal("hide");
		$("#createModal").modal("show");
	}

	$scope.gotoJoinTeam = function(){
		getTeams();
		$scope.errorMessage = false;
		$(".modal").modal("hide");
		$("#joinModal").modal("show");
	}

	$scope.addTeam = function(){
		$scope.errorMessage = false;
		$scope.addingTeam = true;
		$scope.creatingTeam = true;

	}

	$scope.createTeam = function(){
		for(var i = 0; i < $scope.teams.length; i++){
			if($scope.teams[i].name == $scope.teamName){
				$scope.errorMessage = "Team name already taken";
				return;
			}
		}
		$scope.errorMessage = false;
		makeTeam();
	}

	$scope.joinTeam = function(team){
		$scope.startGame(team);
		$scope.sortTeams = true;
		$scope.onTeam = true;
		$(".sort-option").removeClass("active");
		$("#sort-teams").addClass("active");
	}

	$scope.createUser = function(event){
		$scope.errorMessage = false;
		if($scope.playerPassword != $scope.playerPassword2){
			$scope.errorMessage = "Your passwords don't match. Try again.";
		}else{
			$scope.errorMessage = false;
			$http.post(apiPath + "create",{
				userName: $scope.playerName,
				password: $scope.playerPassword
			}).then(function successCallback(response){
				if(response.data.success == "created"){
					$scope.errorMessage = false;
					player.name = $scope.playerName;
					$(".modal").modal("hide");
					$("#spawnModal").modal("show");
				}else if(response.data.failure == "taken"){
					$scope.errorMessage = "Sorry, user name already taken. Please try again.";
				}
			}, function errorCallback(response){
				console.log(response.status);
			});
		}
	}

	$scope.getPlayerStats = function(){
		$http.post(apiPath + "playerStats",{
			userName: $scope.playerName
		}).then(function successCallback(response){
			if(response.data){
				$scope.highScore = response.data.highScore
				$scope.mostOrbsAbsorbed = response.data.mostOrbs 
				$scope.mostPlayersAbsorbed = response.data.mostPlayers
				$(".modal").modal("hide");
				$("#playerModal").modal("show");
			}
		}, function errorCallback(response){
				console.log(response.status);
		});
	}

	$scope.getAllStats = function(){
		$http.post(apiPath + "allStats",{
		}).then(function successCallback(response){
			if(response.data){
				$scope.players = response.data.users;
				$(".modal").modal("hide");
				$("#allModal").modal("show");
			}
		}, function errorCallback(response){
				console.log(response.status);
		});
	}

	function updateStats(){
		$http.post(apiPath + "update",{
			userName: $scope.playerName,
			score: $scope.score,
			orbsAbsorbed: $scope.orbsAbsorbed,
			playersAbsorbed: $scope.playersAbsorbed
		}).then(function successCallback(response){
			if(response.data.success == "update"){
			}else if(response.data.failire == "failedUpdate"){
				console.log("Failed to update database.");
			}
		}, function errorCallback(response){
			console.log(response.status);
		});
	}


//END API CALLS

	$scope.startGame = function(team){
		$scope.addingTeam = false;
		$scope.creatingTeam = false;
		$scope.endGame = false;
		$(".modal").modal("hide");
		$(".hiddenOnStart").removeAttr("hidden");
		if(player.team !== false && player.inGame === true){
			respawn();
		}
		else if(player.name){
			init(team);
		}			
	}

	$scope.leaveTeam = function(){
		socket.emit("leaveTeam", {
			player: player
		});
		$scope.sortOrder = "-score";
		$(".sort-option").removeClass("active");
		$("#sort-score").addClass("active");
		$scope.onTeam = false;
		player.team = false;
		player.inGame = false;
		$(".modal").modal("hide");
		$("#spawnModal").modal("show");
	}

	$scope.playAgain = function(){
		$scope.sortOrder = "-score";
		$(".sort-option").removeClass("active");
		$("#sort-score").addClass("active");
		$(".modal").modal("hide");
		$("#spawnModal").modal("show");
	}

	$scope.gotoStart = function(){
		$(".modal").modal("hide");
		$("#spawnModal").modal("show");
	}
		
// SOCKET.IO STUFF
	function getTeams(){
		socket.emit("getTeams", {
			playerName: player.name
		});
	}

	socket.on("returnTeams", function(data){
		$scope.$apply(function(){
			if(data.teams.length == 0){
				$scope.errorMessage = "Sorry, there are currently no teams.";
				$scope.teams = data.teams;
			}else $scope.teams = data.teams;
		});
	});

	function makeTeam(){
		socket.emit("makeTeam", {
			playerName: player.name,
			teamName: $scope.teamName
		});
		$scope.creatingTeam = false;
	}

	function init(team){
		if(team != undefined){
			socket.emit("init",{
				playerName: player.name,
				team: team
			});
		}else{
			socket.emit("init",{
				playerName: player.name,
				team: false
			});
		}
	}

	function respawn(){
		console.log("respawn");
		socket.emit("respawn",{
			playerID: player.id
		});
	}

	socket.on("init_return", function(data){
		console.log("init return");
		player = data.init;
		orbs = data.orbs;
		bases = data.bases;
		players = data.players;
		tickInterval = setInterval(function(){
			tick();
		}, fps);
		leaderInterval = setInterval(function(){
			leaderCheck();
		}, 2000);
		draw();
	});

	function tick(){
		if(player.alive){
			checkForAction();
			socket.emit("tick",{
				playerID: player.id,
				playerXVector: player.xVector,
				playerYVector: player.yVector,
				playerAction: playerAction
			});
		}
	}

	function leaderCheck(){
		$scope.players = players;
	}

	$scope.sortBy = function(sortItem){
		$scope.sortOrder = "-" + sortItem;
		$(".sort-option").removeClass("active");
		if(sortItem == "teamScore"){
			$scope.sortTeams = true;
			$("#sort-teams").addClass("active");
		}else{
			$scope.sortTeams = false;
			if(sortItem == "score"){
				$("#sort-score").addClass("active");
			}else if(sortItem == "orbsAbsorbed"){
				$("#sort-orbs").addClass("active");
			}else if(sortItem == "playersAbsorbed"){
				$("#sort-players").addClass("active");
			}
		}
	}

	$scope.statSort = function(sortItem){
		$scope.sortStatBy = "-" + sortItem;
		$(".stat-header").removeClass("stat-active");
		if(sortItem == "playerName"){
			$scope.sortStatBy = sortItem;
			$("#sort-stat-player").addClass("stat-active");
		}else if(sortItem == "highScore"){
			$("#sort-stat-score").addClass("stat-active");
		}else if(sortItem == "mostOrbs"){
			$("#sort-stat-orbs").addClass("stat-active");
		}else if(sortItem == "mostPlayers"){
			$("#sort-stat-players").addClass("stat-active");
		}
	}

	socket.on("tock", function(data){
		if(player.alive){
			for(var i = 0; i < data.players.length; i++){
				if(data.players[i].id == player.id){
					player = data.players[i];					
				}
			}
			players = data.players;
			$scope.$apply(function(){
				if(player.team !== false){
					$scope.myTeamScore = data.teams[player.team].teamScore;
				}
				$scope.teams = data.teams;
				$scope.score = player.score;
			});
		}
	});

	socket.on("bases", function(data){
		bases = data.bases;
	});

	socket.on("join", function(data){
		if(player.name != data.playerName && data.teamName === false){
			$scope.gameMessage = data.playerName + " joined the game!";
			$("#game-message").css({"background-color": "#00e600"});
			$("#game-message").css({opacity: 0.7});
			$("#game-message").fadeTo(5000, 0);
		}else if(player.name != data.playerName){
			$scope.gameMessage = data.playerName + " joined team " + data.teamName;
			$("#game-message").css({"background-color": "#00e600"});
			$("#game-message").css({opacity: 0.7});
			$("#game-message").fadeTo(5000, 0);
		}
	});

	socket.on("orbs", function(data){
		orbs = data.orbs;
	});

	socket.on("death", function(data){
		if(player.id == data.died.id){	
			$(".hiddenOnStart").attr("hidden", "hidden");
			player.alive = false;
			clearInterval(tickInterval);
			clearInterval(leaderInterval);
			$("#deathModal").modal("show");
			$scope.$apply(function(){
				$scope.killer = data.killedBy;
				$scope.score = data.died.score;
				$scope.orbsAbsorbed = data.died.orbsAbsorbed;
				$scope.playersAbsorbed = data.died.playersAbsorbed;
			});
			updateStats();
		}else if(player.name == data.killedBy){
			$scope.gameMessage = "You absorbed " + data.died.name;
			$("#game-message").css({"background-color": "#e600e6"});
			$("#game-message").css({opacity: 0.7});
			$("#game-message").fadeTo(5000, 0);
		}else{
			$scope.gameMessage = "Player " + data.died.name + " absorbed by " + data.killedBy;
			$("#game-message").css({"background-color": "#00e6e6"});
			$("#game-message").css({opacity: 0.7});
			$("#game-message").fadeTo(6000, 0);
		}
	});

	socket.on("win", function(data){
		$(".hiddenOnStart").attr("hidden", "hidden");
		player.alive = false;
		player.inGame = false;
		$scope.onTeam = false;
		$scope.endGame = true;
		clearInterval(tickInterval);
		clearInterval(leaderInterval);
		if(player.team === false){
			$scope.endGameMessage = "Team " + data.winningTeam.name + " won!";
		}else{
			if(data.winningTeam.name === $scope.teams[player.team].name){
				$scope.endGameMessage = "Congrats!!! Team " + data.winningTeam.name + " won!";
			}else{
				$scope.endGameMessage = "Sorry, you lost...Team " + data.winningTeam.name + " won.";
			}
		}
		$("#deathModal").modal("show");
		$scope.$apply(function(){
			$scope.score = player.score;
			$scope.orbsAbsorbed = player.orbsAbsorbed;
			$scope.playersAbsorbed = player.playersAbsorbed;
		});
		player.team = false;
		updateStats();
	});

	// Currently not used, but should stop the camera from over scrolling
	// function clamp(value, min, max){
	//     if(value < min) return min;
	//     else if(value > max) return max;
	//     return value;
	// }

	function draw(){
		if(player.alive === true){	
			canvas.style.width = (wWidth * player.zoom) +"px";
			canvas.style.height = (wHeight * player.zoom) +"px";
			context.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
			context.clearRect(0, 0, canvas.width, canvas.height);//clear the viewport AFTER the matrix is reset

			//Clamp the camera position to the world bounds while centering the camera around the player                                             
			var camX = -player.locX + canvas.width/(2*player.zoom);
			var camY = -player.locY + canvas.height/(2*player.zoom);
			context.translate(camX, camY);

		// DRAW ORBS
			for(var i = 0; i < orbs.length; i++){
				context.beginPath();
				context.fillStyle = orbs[i].color;
				context.arc(orbs[i].locX, orbs[i].locY, orbs[i].radius, 0, Math.PI*2);
				context.fill();
			}
		// DRAW BASES
			for(var i = 0; i < bases.length; i++){
				context.drawImage(base, (bases[i].locX - 64), (bases[i].locY - 64));
				context.beginPath();
				if(bases[i].timeBeforeMove <= 10){
					if(bases[i].timeBeforeMove % 2 == 0){
						context.fillStyle = 'black';
					}else{
						context.fillStyle = '#e60000';
					}
				}else if(bases[i].timeBeforeMove <= 20){
					context.fillStyle = '#e6e600';
				}else{
					context.fillStyle = '#00e600';
				}
				context.arc((bases[i].locX), (bases[i].locY), 26, 0, Math.PI*2);
				context.fill();
			}
		// DRAW PLAYERS
			for (var i = 0; i < players.length; i++){
				if(players[i].alive === true){
					context.beginPath();
					context.fillStyle = players[i].color;
					context.arc(players[i].locX, players[i].locY, players[i].radius, 0, Math.PI*2);
					context.fill();
					context.lineWidth = 5;
					if((players[i].team === player.team && player.team !== false)|| (players[i].id === player.id)){
						context.strokeStyle = '#00ff00';
					}else{
						context.strokeStyle = '#ff0000';
					}
					context.stroke();
				}
			}
			requestAnimationFrame(draw);
		} //End DRAW FUNCTION
	}

	function getMousePosition(canvas, event){
		var rect = canvas.getBoundingClientRect();
		return {
			x: Math.round((event.clientX-rect.left)/(rect.right-rect.left)*canvas.width*player.zoom),
			y: Math.round((event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height*player.zoom)
		};
	}

	addEventListener("keydown", function(event){
		keysDown[event.keyCode] = true
	});
	addEventListener("keyup", function(event){
		delete keysDown[event.keyCode];
	});

	function checkForAction(){
		if(70 in keysDown){
			playerAction = "feed";
		}else{
			playerAction = false;
		}
	}

	canvas.addEventListener("mousemove", function(event){
		var mousePosition = getMousePosition(canvas, event);
		var angleDeg = Math.atan2(mousePosition.y - (canvas.height/2), mousePosition.x - (canvas.width/2)) * 180 / Math.PI;
		if(angleDeg >= 0 && angleDeg < 90){
			player.xVector = 1 - (angleDeg/90);
			player.yVector = -(angleDeg/90);
		}else if(angleDeg >= 90 && angleDeg <= 180){
			player.xVector = -(angleDeg-90)/90;
			player.yVector = -(1 - ((angleDeg-90)/90));
		}else if(angleDeg >= -180 && angleDeg < -90){
			player.xVector = (angleDeg+90)/90;
			player.yVector = (1 + ((angleDeg+90)/90));
		}else if(angleDeg < 0 && angleDeg >= -90){
			player.xVector = (angleDeg+90)/90;
			player.yVector = (1 - ((angleDeg+90)/90));
		}
	}, false);


//END CONTROLLER
});

	
















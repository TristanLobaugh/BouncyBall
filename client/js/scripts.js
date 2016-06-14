var app = angular.module("orbApp", []);
app.controller("orbController", function($scope, $http){
	var player = {};
	var keysDown = [];
	var playerAction = false;
	var orbs;
	var players;
	var wHeight = $(window).height();
	var wWidth = $(window).width();
	var tickInterval;
	var leaderInterval;
	var fps = 1000/25;

//FOR AWS
	// var apiPath = "http://tristanlobaugh.com:3333/";
	var apiPath = "http://localhost:3333/";

	var canvas = document.getElementById("the-canvas");
	var context = canvas.getContext("2d");
	canvas.width = wWidth;
	canvas.height = wHeight;

	var socket = io.connect();

	$scope.score = 0;
	$scope.sortOrder = "-score";
	$scope.errorMessage = false;

	$(window).load(function(){
		$("#loginModal").modal("show");
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
		$(".modal").modal("hide");
		$(".hiddenOnStart").removeAttr("hidden");
		if(player.name){
			init(team);
		}			
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

	socket.on("init_return", function(data){
		player = data.init;
		orbs = data.orbs;
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
		if(sortItem == "score"){
			$("#sort-score").addClass("active");
		}else if(sortItem == "orbsAbsorbed"){
			$("#sort-orbs").addClass("active");
		}else if(sortItem == "playersAbsorbed"){
			$("#sort-players").addClass("active");
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
			orbs = data.orbs;
			$scope.$apply(function(){
				$scope.score = player.score;
			});
		}
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

	// Currently not used, but should stop the camera from over scrolling
	// function clamp(value, min, max){
	//     if(value < min) return min;
	//     else if(value > max) return max;
	//     return value;
	// }

	function draw(){
		if(player.alive == true){	
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
		// DRAW PLAYERS
			for (var i = 0; i < players.length; i++){
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

	
















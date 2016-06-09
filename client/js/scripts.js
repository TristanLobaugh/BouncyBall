var app = angular.module("orbApp", []);
app.controller("orbController", function($scope){
	var player = {};
	var orbs;
	var players;
	var wHeight = $(window).height();
	var wWidth = $(window).width();
	var tickInterval;
	var leaderInterval;
	var fps = 1000/30;

	var canvas = document.getElementById("the-canvas");
	var context = canvas.getContext("2d");
	canvas.width = wWidth;
	canvas.height = wHeight;

	var socket = io.connect();

	$scope.score = 0;
	$scope.sortOrder = "-score";

	$(window).load(function(){
		$("#loginModal").modal("show");
	});

	$(".name-form").submit(function(event){
		event.preventDefault();
		player.name = $("#name-input").val();
		$(".modal").modal("hide");
		$(".hiddenOnStart").removeAttr("hidden");
		if(player.name){
			init();
		}	
	});

	$scope.createUser = function(){

	}

	$scope.startGame = function(){
		player.name = $scope.playerName
	}



	// SOCKET.IO STUFF
	function init(){
		socket.emit("init",{
			playerName: player.name
		});
	}

	socket.on("init_return", function(data){
		player = data.init;
		orbs = data.orbs;
		players = data.players;
		console.log(player.id);
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
			socket.emit("tick",{
				playerID: player.id,
				playerXVector: player.xVector,
				playerYVector: player.yVector
			});
		}
	}

	function leaderCheck(){
		console.log($scope.sortOrder);
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
		players = data.players;
		orbs = data.orbs;
		player = data.player;
		$scope.$apply(function(){
			$scope.score = player.score;
		});
	});

	socket.on("death", function(data){
		console.log(data);
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
			console.log($scope.killer);
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
				if(players[i].id != player.id){
					context.strokeStyle = '#ff0000';
				}else{
					context.strokeStyle = '#00ff00';
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

	
















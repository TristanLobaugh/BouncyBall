$(document).ready(function(){

// SOCKET.IO STUFF
	var socketio = io.connect();
	socketio.on("message_to_client", function(data){
		console.log(data.message);
	});

	var startPlayers = 25;
	var startPoints = 1000;
	var speed = 4;
	var xVector = 0;
	var yVector = 0;
	var zoom = 1.5;

	var points = [];
	var players = [];
	
	var wHeight = $(window).height() - 10;
	var wWidth = $(window).width() - 10;

	var worldWidth = 5000;
	var worldHeight = 5000;


	var canvas = document.getElementById("the-canvas");
	var context = canvas.getContext("2d");
	canvas.width = wWidth;
	canvas.height = wHeight;
	function newPlayer(num){
		for(var i = 0; i < num; i++){
			players.push(new Player());
		}
	}

	function Player(){
		this.locX = Math.floor((Math.random()*worldWidth) + 10); 
		this.locY = Math.floor((Math.random()*worldHeight) + 10);
		this.speed = speed;
		this.radius = 6;
		this.color = getRandomColor();
	}
	// Currently not used, but should stop the camera from over scrolling
	// function clamp(value, min, max){
	//     if(value < min) return min;
	//     else if(value > max) return max;
	//     return value;
	// }

	function draw(){
		canvas.style.width = (wWidth * zoom) +"px";
		canvas.style.height = (wHeight * zoom) +"px";
		context.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
		context.clearRect(0, 0, canvas.width, canvas.height);//clear the viewport AFTER the matrix is reset

		//Clamp the camera position to the world bounds while centering the camera around the player                                             
		var camX = -players[0].locX + canvas.width/(2*zoom);
		var camY = -players[0].locY + canvas.height/(2*zoom);

		context.translate(camX, camY);

	// DRAW POINTS
		for(var i = 0; i < points.length; i++){
			context.beginPath();
			context.fillStyle = points[i].color;
			context.arc(points[i].locX, points[i].locY, points[i].radius, 0, Math.PI*2);
			context.fill();
		}
	// DRAW PLAYERS
		for (var i = 0; i < players.length; i++){
			if(players[i].locX < 10 || players[i].locX > worldWidth){
				players[i].speed = -players[i].speed;
			}else if(players[i].locY < 10 || players[i].locY > worldHeight){
				players[i].speed = -players[i].speed;
			}
			context.beginPath();
			context.fillStyle = players[i].color;
			context.arc(players[i].locX, players[i].locY, players[i].radius, 0, Math.PI*2);
			context.fill();
			context.lineWidth = 5;
			if(i != 0){
				context.strokeStyle = '#ff0000';
				players[i].locX += players[i].speed;
				players[i].locY += players[i].speed;
			}else{
				context.strokeStyle = '#00ff00';
				players[i].locX += players[i].speed * xVector;
				players[i].locY -= players[i].speed * yVector;
			}
			context.stroke();

		}

		checkForCollisions();
		requestAnimationFrame(draw);
	} //End DRAW FUNCTION

	function getMousePosition(canvas, event){
		var rect = canvas.getBoundingClientRect();
		return {
			x: Math.round((event.clientX-rect.left)/(rect.right-rect.left)*canvas.width*zoom),
			y: Math.round((event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height*zoom)
		};
	}

	function pointsMaker(num){
		for(var i = 0; i < num; i++){
			points.push(new Point());
		}
	}

	function Point(){
		this.color = getRandomColor();
		this.locX = Math.floor((Math.random()*worldWidth) + 10); 
		this.locY = Math.floor((Math.random()*worldHeight) + 10);
		this.radius = 5;
	}

	function getRandomColor(){
		var r = Math.floor((Math.random()*256)),
			g = Math.floor((Math.random()*256)),
			b = Math.floor((Math.random()*256));
		return "rgb(" + r + "," + g + "," + b + ")";
	}

	function checkForCollisions(){
		for(var i = 0; i < players.length; i++){
			for(var j = 0; j < points.length; j++){
			// AABB Test(square)
				if(players[i].locX + players[i].radius + points[j].radius > points[j].locX 
					&& players[i].locX < points[j].locX + players[i].radius + points[j].radius
					&& players[i].locY + players[i].radius + points[j].radius > points[j].locY 
					&& players[i].locY < points[j].locY + players[i].radius + points[j].radius){
				// Pythagoras test(cricle)
						distance = Math.sqrt(
							((players[i].locX - points[j].locX) * (players[i].locX - points[j].locX)) + 
							((players[i].locY - points[j].locY) * (players[i].locY - points[j].locY))	
							);
						if(distance < players[i].radius + points[j].radius){
							players[i].color = points[j].color;
							if(i == 0 && zoom > 1){
								zoom -= .001;
							}
							points.splice(j, 1);
							players[i].radius += 0.25;
							if(players[i].speed < -0.005){
								players[i].speed += 0.005;
							}else if(players[i].speed > 0.005){
								players[i].speed -= 0.005;
							}
							if(points.length < startPoints){
								pointsMaker(1);
							}
						}
				}
			}
			for(var k = 0; k < players.length; k++){
				if(players[i] != players[k]){
				// AABB Test
					if(players[i].locX + players[i].radius + players[k].radius > players[k].locX 
					&& players[i].locX < players[k].locX + players[i].radius + players[k].radius
					&& players[i].locY + players[i].radius + players[k].radius > players[k].locY 
					&& players[i].locY < players[k].locY + players[i].radius + players[k].radius){
				// Pythagoras test
						distance = Math.sqrt(
							((players[i].locX - players[k].locX) * (players[i].locX - players[k].locX)) + 
							((players[i].locY - players[k].locY) * (players[i].locY - players[k].locY))	
							);
						if(distance < players[i].radius + players[k].radius){
							if(players[i].radius > players[k].radius){
						// BOT DEATH
								socketio.emit("message_to_server", {
									message: "Bot Killed",
									id: k,
									killedBy: i,
									radius: players[k].radius
								});
								players[i].radius += (players[k].radius * 0.25)
								if(i == 0){
									zoom -= (players[k].radius * 0.25) * .001;
								}
								players.splice(k, 1);
							}else if(players[i].radius < players[k].radius){
						// Player DEATH
								socketio.emit("message_to_server", {
									message: "PLAYER DEATH",
									id: i,
									killedBy: k,
									radius: players[i].radius
								});								
								players[k].radius += (players[i].radius * 0.25)
								zoom -= (players[i].radius * 0.25) * .01;
								players.splice(i, 1)

							}
						}
					}
				}
			}
		}
	}


	pointsMaker(startPoints);
	newPlayer(startPlayers);
	canvas.addEventListener("mousemove", function(event){
		var mousePosition = getMousePosition(canvas, event);
		var angleDeg = Math.atan2(mousePosition.y - (canvas.height/2), mousePosition.x - (canvas.width/2)) * 180 / Math.PI;
		if(angleDeg >= 0 && angleDeg < 90){
			xVector = 1 - (angleDeg/90);
			yVector = -(angleDeg/90);
		}else if(angleDeg >= 90 && angleDeg <= 180){
			xVector = -(angleDeg-90)/90;
			yVector = -(1 - ((angleDeg-90)/90));
		}else if(angleDeg >= -180 && angleDeg < -90){
			xVector = (angleDeg+90)/90;
			yVector = (1 + ((angleDeg+90)/90));
		}else if(angleDeg < 0 && angleDeg >= -90){
			xVector = (angleDeg+90)/90;
			yVector = (1 - ((angleDeg+90)/90));
		}


	}, false);
	draw(); 
//END CODE
});

	
















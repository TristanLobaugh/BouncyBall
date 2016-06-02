$(document).ready(function(){
	var startPlayers = 25;
	var startPoints = 2000;
	var speed = 4;
	var xVector = 0;
	var yVector = 0;

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
	// canvas.style.width = (wWidth * 2) +"px";
	// canvas.style.height = (wHeight * 2) +"px";
	function newPlayer(num){
		for(var i = 0; i < num; i++){
			players.push(new Player());
		}
	}

	function Player(){
		this.locX = Math.floor((Math.random()*worldWidth) + 10); 
		this.locY = Math.floor((Math.random()*worldHeight) + 10);
		this.xSpeed = speed;
		this.ySpeed = -speed;
		this.radius = 6;
		this.color = getRandomColor();
	}

	function clamp(value, min, max){
	    if(value < min) return min;
	    else if(value > max) return max;
	    return value;
	}

	function draw(){
		context.setTransform(1,0,0,1,0,0);//reset the transform matrix as it is cumulative
		context.clearRect(0, 0, canvas.width, canvas.height);//clear the viewport AFTER the matrix is reset

		//Clamp the camera position to the world bounds while centering the camera around the player                                             
		var camX = -players[0].locX + canvas.width/2;
		var camY = -players[0].locY + canvas.height/2;

		context.translate( camX, camY );

		//Draw everything
		// context.clearRect(0,0, wWidth,wHeight);
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
				players[i].xSpeed = -players[i].xSpeed;
			}else if(players[i].locY < 10 || players[i].locY > worldHeight){
				players[i].ySpeed = -players[i].ySpeed;
			}
			context.beginPath();
			context.fillStyle = players[i].color;
			context.arc(players[i].locX, players[i].locY, players[i].radius, 0, Math.PI*2);
			context.fill();
			if(i != 0){
				players[i].locX += players[i].xSpeed;
				players[i].locY += players[i].ySpeed;
			}else{
				players[i].locX += players[i].xSpeed * xVector;
				players[i].locY += players[i].ySpeed * yVector;
			}

		}

		checkForCollisions();
		requestAnimationFrame(draw);
	} //End DRAW FUNCTION

	function getMousePosition(canvas, event){
		var rect = canvas.getBoundingClientRect();
		return {
			x: Math.round((event.clientX-rect.left)/(rect.right-rect.left)*canvas.width),
			y: Math.round((event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height)
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
				if(players[i].locX + players[i].radius + points[j].radius > points[j].locX 
					&& players[i].locX < points[j].locX + players[i].radius + points[j].radius
					&& players[i].locY + players[i].radius + points[j].radius > points[j].locY 
					&& players[i].locY < points[j].locY + players[i].radius + points[j].radius){
						// console.log("Collision! Point!: x:" + players[i].locX + " y:" + players[i].locY);
					players[i].color = points[j].color;
					points.splice(j, 1);
					players[i].radius += 0.25;
					if(players[i].xSpeed < -0.01){
						players[i].xSpeed += 0.01;
					}else if(players[i].xSpeed > 0.01){
						players[i].xSpeed -= 0.01;
					}
					if(players[i].ySpeed < -0.01){
						players[i].ySpeed += 0.01;
					}else if(players[i].ySpeed > 0.01){
						players[i].ySpeed -= 0.01;
					}
					if(points.length < startPoints){
						pointsMaker(1);
					}
					// console.log("collision! Xspeed=" +  players[i].xSpeed + players[i].ySpeed);
				}
			}
			for(var k = 0; k < players.length; k++){
				if(players[i] != players[k]){
					if(players[i].locX + players[i].radius + players[k].radius > players[k].locX 
					&& players[i].locX < players[k].locX + players[i].radius + players[k].radius
					&& players[i].locY + players[i].radius + players[k].radius > players[k].locY 
					&& players[i].locY < players[k].locY + players[i].radius + players[k].radius){
						// console.log("Collision! Players!: x:" + players[i].locX + " y:" + players[i].locY);
						if(players[i].radius > players[k].radius){
							players.splice(k, 1);
						}else if(players[i].radius < players[k].radius){
							players.splice(i, 1)
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
		console.log(angleDeg);
		if(angleDeg >= 0 && angleDeg < 90){
			xVector = 1 - (angleDeg/90);
			yVector = -(angleDeg/90);
			console.log(xVector + " ======= " + yVector);
		}else if(angleDeg >= 90 && angleDeg <= 180){
			xVector = -(angleDeg-90)/90;
			yVector = -(1 - ((angleDeg-90)/90));
			console.log(xVector + " ======= " + yVector);
		}else if(angleDeg >= -180 && angleDeg < -90){
			xVector = (angleDeg+90)/90;
			yVector = (1 + ((angleDeg+90)/90));
			console.log(xVector + " ======= " + yVector);
		}else if(angleDeg < 0 && angleDeg >= -90){
			xVector = (angleDeg+90)/90;
			yVector = (1 - ((angleDeg+90)/90));
			console.log(xVector + " ======= " + yVector);
		}


	}, false);
	draw(); 
//END CODE
});

	
















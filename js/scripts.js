$(document).ready(function(){
	var points = [];
	var players = [];
	var wHeight = $(window).height() - 10;
	var wWidth = $(window).width() - 10;

	var canvas = document.getElementById("the-canvas");
	var context = canvas.getContext("2d");
	canvas.height = wHeight;
	canvas.width = wWidth;
	// canvas.style.height = (wHeight * 2) +"px";
	// canvas.style.width = (wWidth * 2) +"px";
	function newPlayer(num){
		for(var i = 0; i < num; i++){
			players.push(new Player());
		}
	}

	function Player(){
		this.locX = Math.floor((Math.random()*wWidth) + 10); 
		this.locY = Math.floor((Math.random()*wHeight) + 10);
		this.xSpeed = 1;
		this.ySpeed = 1;
		this.radius = 10;
		this.color = getRandomColor();
	}

	function draw(){
		context.clearRect(0,0, wWidth,wHeight);
// DRAW POINTS
		for(var i = 0; i < points.length; i++){
			context.beginPath();
			context.fillStyle = points[i].color;
			context.arc(points[i].locX, points[i].locY, points[i].radius, 0, Math.PI*2);
			context.fill();
		}
// DRAW PLAYERS
		for (var i = 0; i < players.length; i++){
			if(players[i].locX < 10){
				players[i].xSpeed = Math.floor(Math.random() * 6);
			}
			else if(players[i].locX > wWidth){
				players[i].xSpeed = -(Math.floor(Math.random() * 6));
			}else if(players[i].locY < 10){
				players[i].ySpeed = Math.floor(Math.random() * 6);
			}
			else if(players[i].locY > wHeight){
				players[i].ySpeed = -(Math.floor(Math.random() * 6));
			}
			context.beginPath();
			context.fillStyle = players[i].color;
			context.arc(players[i].locX, players[i].locY, players[i].radius, 0, Math.PI*2);
			context.fill();
			players[i].locX += players[i].xSpeed;
			players[i].locY += players[i].ySpeed;
		}

		checkForCollisions();
		requestAnimationFrame(draw);
	}

	function pointsMaker(num){
		for(var i = 0; i < num; i++){
			points.push(new Point());
		}
	}

	function Point(){
		this.color = getRandomColor();
		this.locX = Math.floor((Math.random()*wWidth) + 10); 
		this.locY = Math.floor((Math.random()*wHeight) + 10);
		this.radius = 3;
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
					if(points.length < 100){
						pointsMaker(1);
					}
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


	pointsMaker(150);
	newPlayer(4);
	draw(); 
//END CODE
});

	
















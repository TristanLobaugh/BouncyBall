$(document).ready(function(){
	var orbs;
	var players;
	var wHeight = $(window).height();
	var wWidth = $(window).width();
	var player = {};
	player.zoom = 1.5;

	var startorbs = 1000;



	var canvas = document.getElementById("the-canvas");
	var context = canvas.getContext("2d");
	canvas.width = wWidth;
	canvas.height = wHeight;

	// SOCKET.IO STUFF
	var socket = io.connect();
	socket.on("message_to_client", function(data){
		console.log(data.message);		
	});

	socket.on("init", function(data){
		player = data.init;
		orbs = data.orbs;
		players = data.players;
		console.log(player.id);
		draw();
	});

	setInterval(function(){
		socket.emit("tick",{
			player: player
		});
	}, 1000/25);

	socket.on("tock", function(data){
		players = data.players;
		orbs = data.orbs;
		player = data.player;
	});


	// Currently not used, but should stop the camera from over scrolling
	// function clamp(value, min, max){
	//     if(value < min) return min;
	//     else if(value > max) return max;
	//     return value;
	// }

	function draw(){
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
//END CODE
});

	
















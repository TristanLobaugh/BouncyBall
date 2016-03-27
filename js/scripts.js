
var canvas = document.getElementById("the-canvas");
var context = canvas.getContext("2d");

var x=400;
var xSpeed = 5;
var ySpeed = 5;
var y = 300;
var radius = 10;

function draw(){
	if(x < 10){
		xSpeed = Math.floor(Math.random() * 6);
		console.log(xSpeed);
	}
	else if(x > 790){
		xSpeed = -(Math.floor(Math.random() * 6));
		console.log(xSpeed);
	}else if(y < 10){
		ySpeed = Math.floor(Math.random() * 6);
		console.log(ySpeed);
	}
	else if(y > 590){
		ySpeed = -(Math.floor(Math.random() * 6));
		console.log(ySpeed);
	}
	context.clearRect(0,0, 800,600);
	context.beginPath();
	context.arc(x, y, radius, 0, Math.PI*2);
	context.fill();
	x += xSpeed;
	y += ySpeed;
}

var ballInt = setInterval(draw, 15);
console.log(x);
	
















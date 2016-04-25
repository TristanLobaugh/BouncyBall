
var canvas = document.getElementById("the-canvas");
var context = canvas.getContext("2d");

var x=400;
var xSpeed = 5;
var ySpeed = 5;
var y = 300;
var radius = 11;
var points = [];

function draw(){
	if(x < 10){
		xSpeed = Math.floor(Math.random() * 6);
	}
	else if(x > 790){
		xSpeed = -(Math.floor(Math.random() * 6));
	}else if(y < 10){
		ySpeed = Math.floor(Math.random() * 6);
	}
	else if(y > 590){
		ySpeed = -(Math.floor(Math.random() * 6));
	}
	context.clearRect(0,0, 800,600);

	for(var i = 0; i < points.length; i++){
	context.beginPath();
	context.fillStyle = points[i].color;
	context.arc(points[i].locX, points[i].locY, 3, 0, Math.PI*2);
	context.fill();
	}

	context.beginPath();
	context.arc(x, y, radius, 0, Math.PI*2);
	context.fill();
	x += xSpeed;
	y += ySpeed;
}

function pointsMaker(num){
	for(var i = 0; i < num; i++){
		points.push(new Point());
	}
}

function Point(){
	this.color = getRandomColor();
	this.locX = Math.floor((Math.random()*781) + 10); 
	this.locY = Math.floor((Math.random()*581) + 10);
}

function getRandomColor(){
	var r = Math.floor((Math.random()*256)),
		g = Math.floor((Math.random()*256)),
		b = Math.floor((Math.random()*256));
	return "rgb(" + r + "," + g + "," + b + ")";
}

pointsMaker(50);


var ballInt = setInterval(draw, 15);

	

















var canvas = document.getElementById("the-canvas");
var context = canvas.getContext("2d");

var x=150;
var y = 150;
var radius = 10;
var endArc = 0

function draw(){
	context.clearRect(0,0, 800,600);
	context.beginPath();
	context.arc(x, y, radius, 0, Math.PI*endArc);
	context.fill();
	x += 4;
	y += 2;
	radius += 1;
	endArc += .1;
}

var ballInt = setInterval(draw, 15);
console.log(x);
	
















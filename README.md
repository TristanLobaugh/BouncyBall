# Bouncy Ball

### Canvas based app

## Summary

#### A canvas based app that has a round object moving around on the screen that appears to bounch off the walls of the canvas. The app also create many little round object on load that will eventually change the color of the ball when it collides with one of the smaller objects.

### Author: Tristan Lobaugh 
+ Github - https://github.com/TristanLobaugh
+ Homepage - http://tristanlobaugh.com

## Demo

[Live Demo](http://tristanlobaugh.com/bouncyball)

## Screenshots

### Main page:
![alt text](https://raw.githubusercontent.com/TristanLobaugh/bouncyball/master/img/screen_shot.png)


##Code Examples

### canvas draw function
```
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
```


## To Do
Have ball change collor on collision
Remove other dots from canvas on collsion
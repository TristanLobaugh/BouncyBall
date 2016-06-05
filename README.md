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

### Event listener for having plotting the mouse position relative to the players location.
```
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
```

### 
```

```


## To Do
Have ball change collor on collision
Remove other dots from canvas on collsion
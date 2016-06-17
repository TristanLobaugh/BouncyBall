# Orb-Blitz

### Canvas based game using the MEAN stack

## Summary

#### A canvas based multiplayer game that is written using AngularJS, Mongo, Express and Node.js. Players can play as a team or solo. Team players have the goal of absorbing orbs and then deposition thier mass into a base. When the team reaching the goal their team wins the match and the game then restarts. Player stats are stored in a mongo database and can be viewed on the game page.

### Author: Tristan Lobaugh 
+ Github - https://github.com/TristanLobaugh
+ Homepage - http://tristanlobaugh.com

## Demo

[Live Demo](http://tristanlobaugh.com/Orb-Blitz/)

## Screenshots

### Game Play:
![alt text](https://raw.githubusercontent.com/TristanLobaugh/bouncyball/master/img/Orb-Blitz_gameplay.png)

### Stats Page:
![alt text](https://raw.githubusercontent.com/TristanLobaugh/bouncyball/master/img/Orb-Blitz_stats.png)

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

### Base Mechanics for collisions and offloading the players mass.
```
for (var i = 0; i < bases.length; i++) {
    if (player.action == "feed" && player.team !== false && player.radius > defaultSize) {
        // AABB Test
        if (player.locX + player.radius + 47 > bases[i].locX && player.locX < bases[i].locX + player.radius + 47 && player.locY + player.radius + 47 > bases[i].locY && player.locY < bases[i].locY + player.radius + 47) {
        // Pythagoras test
            distance = Math.sqrt(
                ((player.locX - bases[i].locX) * (player.locX - bases[i].locX)) +
                ((player.locY - bases[i].locY) * (player.locY - bases[i].locY))
            );
            if (distance < player.radius + 47) {
        //COLLISION
                player.radius -= 0.125;
                teams[player.team].teamScore += 0.5;
        //WIN CHECK
                if(teams[player.team].teamScore >= scoreToWin){
        //WIN!!!
        			win(teams[player.team]);	
                }
                if (player.speed < defaultSpeed) {
                    player.speed += 0.0025;
                }
                if (player.zoom < defaultzoom) {
                    player.zoom += 0.0005
                }
            }
        }
    }
}
```


## To Do

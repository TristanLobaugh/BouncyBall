var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
connections = [];

app.use(express.static(__dirname + '/../client'));

	io.sockets.on("connect", function(socket){
	   console.log(socket.id)
		connections.push(socket);
		console.log('Connected: %s sockets connected', connections.length);

		socket.on("message_to_server", function(data){
			console.log(data);
			io.sockets.emit("message_to_client",{
				message: "Message Recieved, player " + data.id + " killed by player " + data.killedBy + " when he had radius of " + data.radius + "."  
			});
		});

		socket.on('disconnect', function(data){
			connections.splice(connections.indexOf(socket), 1);
			console.log('Disconnected: %s sockets connected', connections.length);
		});		
	});


server.listen(process.env.port || 3333);
console.log('server running on port 3333');
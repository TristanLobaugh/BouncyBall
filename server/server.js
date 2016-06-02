module.exports = function (io) { 
// io.on(‘conection blah blah blah 


	io.sockets.on("connect", function(socket){
		socket.on("message_to_server", function(data){
			console.log(data);
			io.sockets.emit("message_to_client",{
				message: "Message Recieved, player " + data.id + " killed by player " + data.killedBy + " when he had radius of " + data.radius + "."  
			})
		})
	})

}


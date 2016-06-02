var express = require('express');
var router = express.Router();
// var myscoket = require('')
var mongoose = require('mongoose');
var connection = mongoose.connect('mongodb://localhost:27017/bounce');
var Bounce = require('../models/bounce');
var mysocket = require("../server");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/connect', function(req, res){
		io.sockets.on("connect", function(socket){
			console.log(socket);
		socket.on("message_to_server", function(data){
			console.log(data);
			io.sockets.emit("message_to_client",{
				message: "Message Recieved, player " + data.id + " killed by player " + data.killedBy + " when he had radius of " + data.radius + "."  
			});
		});
	});
  // console.log("getting");
  // Bounce.find({}, function(err, data){
  //   res.json(data);
  });


module.exports = router;

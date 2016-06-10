var express = require('express');
var router = express.Router();
var bcrypt = require("bcrypt-nodejs");
var bodyParser = require('body-parser');
var mongoUrl = "mongodb://localhost:27017/orb-blitz";
var mongoose = require('mongoose');
var User = require('../models/players');
var mysocket = require("../server");
mongoose.connect(mongoUrl);

var highScore;
var mostOrbs;
var mostPlayers;

router.post("/login", function(req, res, next){
	User.findOne(
		{playerName: req.body.userName}, function(err, doc){
			if(doc == null){
				res.json({failure: "noUser"});
			}else{
				var passwordMatch = bcrypt.compareSync(req.body.playerPassword, doc.password);
				if(passwordMatch){
					for(var i = 0; i < connections.length; i++){
						if(connections[i].loggedIn == req.body.userName){
							console.log(connections[i].loggedIn + " Already logged in")
							res.json({failure: "loggedIn"});
							return;
						}
					}
					for(var i = 0; i < connections.length; i++){
						if(connections[i].conn.id == req.body.socketID){
							connections[i].loggedIn = req.body.userName;
						}
					}
					res.json({
						success: "found",
					});
				}else{
					res.json({failure: "badPassword"});
				}
			}
		}
	);	
});

router.post("/create", function(req, res, next){
	User.findOne(
	{playerName: req.body.userName}, function(err, doc){
			if(doc == null){
				var newUser = new User({
					playerName: req.body.userName,
					password: bcrypt.hashSync(req.body.password),
					highScore: 0,
					mostOrbs: 0,
					mostPlayers: 0
				});
				newUser.save();
				res.json({
					success: "created"
				});
			}else{
				res.json({failure: "taken"});
			}
		}
	);
});

router.post("/update", function(req, res, next){
	User.findOne(
		{playerName: req.body.userName}, function(err, doc){
			highScore = (doc.highScore < req.body.score) ? req.body.score : doc.highScore;
			mostOrbs = (doc.mostOrbs < req.body.orbsAbsorbed) ? req.body.orbsAbsorbed : doc.mostOrbs;
			mostPlayers = (doc.mostPlayers < req.body.playersAbsorbed) ? req.body.playersAbsorbed : doc.mostPlayers;
			User.update(
				{playerName: req.body.userName},
				{
					highScore: highScore,
					mostOrbs: mostOrbs,
					mostPlayers: mostPlayers
				},
				{mutli: true},
				function(err, numberAffected){
					if(numberAffected.ok == 1){
						res.json({success: "update"});
					}else{
						res.json({failure: "failedUpdate"});
					}
				}
			);
		}
	);

});

router.post("/playerStats", function(req, res, next){
	User.findOne(
		{playerName: req.body.userName}, function(err, doc){
			res.json({
				highScore: doc.highScore,
				mostOrbs: doc.mostOrbs,
				mostPlayers: doc.mostPlayers
			});
		}
	);
});

router.post("/allStats", function(req, res, next){
	User.find({}, function(err, users){
		res.json({users});
	});
});



module.exports = router;

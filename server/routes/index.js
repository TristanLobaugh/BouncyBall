var express = require('express');
var router = express.Router();
var bcrypt = require("bcrypt-nodejs");
var mongoUrl = "mongodb://localhost:27017/orb-blitz";
var mongoose = require('mongoose');
var User = require('../models/players');
var mysocket = require("../server");
mongoose.connect(mongoUrl);

router.post("/login", function(req, res, next){
	User.findOne(
		{playerName: req.body.userName}, function(err, doc){
			if(doc == null){
				res,json({failure: "noUser"});
			}else{
				var passwordMatch = bcrypt.compareSync(req.body.playerPassword, doc.password);
				if(passwordMatch){
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
				var highScore = (doc.highScore < req.body.score) ? req.body.score : doc.highScore;
				var mostOrbs = (doc.mostOrbs < req.body.orbsAbsorbed) ? req.body.orbsAbsorbed : doc.mostOrbs;
				var mostPlayers = (doc.mostPlayers < req.body.playersAbsorbed) ? req.body.playersAbsorbed : doc.mostPlayers;
		}
	);
	User.update(
		{playerName: req.body.userName},
		{
				highScore: highScore,
				mostOrbs: mostOrbs,
				mostPlayers: mostPlayers
		},
		{multi: true},
		function(err, numberAffected){
			if(numberAffected.ok == 1){
				res.json({success: "update"});
			}else{
				res.json({failure: "failedupdate"});
			}
		}
	);
});

router.get("/playerStats", function(req, res, next){
	User.findOne(
		{playerName: req.body.userName}, function(err, doc){
			res.json(doc);
		}
	);
});

router.get("/allStats", function(req, res, next){
	User.find({}, function(err, users){
		res.json(users);
	});
});



module.exports = router;

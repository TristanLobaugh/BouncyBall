var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = new Schema({
	// "_id": {
	// 	type: Schema.ObjectId,
	// 	ref: "players"
	// },
	playerName: String,
	highScore: Number,
	mostOrbs: Number,
	mostPlayers: Number
	// teamName: String,
	// bestTeamScore: Number
});

module.exports = mongoose.model("Player", playerSchema);
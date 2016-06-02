var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var playerSchema = new Schema({
	// "_id": {
	// 	type: Schema.ObjectId,
	// 	ref: "players"
	// },
	name: String,
	teamName: String,
	bestIndvScore: Number,
	bestTeamScore: Number
});

module.exports = mongoose.model("Player", playerSchema);
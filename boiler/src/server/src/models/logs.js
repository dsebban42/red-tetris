const mongoose		= require('mongoose');
const Schema		= mongoose.Schema;
const moment		= require('moment');

const PlayerSchema = new Schema({
	name : {
		type: String,
		required: true,
		default: null
	},
	lastScore : {
		type: Number,
		required: false,
		default: null
	},
});

/*const LogsSchema = new Schema({
	ip: {
		type: String,
		required: false,
		default: "0.0.0.0"
	},
	data: {
		type: Object,
		required: false,
		default: {}
	},
	created_at: {
		type: Date,
		required: false,
		default: moment().format()
	}
});*/

module.exports = PlayerSchema;

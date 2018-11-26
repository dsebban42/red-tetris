const express			= require("express");
const app					= express();
const port				= process.env.PORT || 8080;
const moment			= require('moment');
const mongoose		= require('mongoose');
const cors				= require('cors');
const http				= require("http");
const path				= require('path');
const server			= http.createServer(app);
const bodyParser	= require('body-parser');
const io					= require('socket.io')(server, {
														pingInterval: 10000,
														pingTimeout: 50000,
														cookie: false
});

const fs = require('fs');
mongoose.plugin(require('meanie-mongoose-to-json'));

require("fs").readdirSync("./src/server/src/models").forEach(function(file) {
});

	var MainApp 	= require("./MainApp.js");
	const mainApp = new MainApp();
	mainApp.Init(io);


	mongoose.Promise = global.Promise;
	 // { useMongoClient: true },
	mongoose.connect('mongodb://127.0.0.1:27017/redtetris', function (err) {
		console.log(err);
	});

	//#########################
	//	 Authorization headers
	//#########################
	app.use(express.static('build'));

	export const readfile = (res, err, data) => {
		if (err) {
			// logerror(err)
		console.log(err);
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	};

	export const loadingIndex = (req, res) => {
		// const file = req.url === '/bundle.js' ? '/../../build/bundle.js' : '/../../index.html'
		fs.readFile('./index.html', readfile.bind(null, res));
		return readfile;
	};

	export const get = () => {
		app.get('/', loadingIndex);
		return loadingIndex;
	};

	get();

	app.use(bodyParser.json());
	app.use(function(req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
		next();
	});

	server.listen(port, function(){
		console.log('server listening at port %d', port);
	});
	console.log('\x1Bc\x1b[32mApi compiled successfully on port:'+port+'\x1b[0m\n'+moment().format('HH:mm:ss'));

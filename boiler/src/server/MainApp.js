"use strict"

const Game 			    = require("./Game.js");
const Player	     	= require("./Player.js");
const Piece		     	= require("./Piece.js");
const mongoose    	= require('mongoose');
const PlayersSchema = require("./src/models/logs.js");

function MainApp ()
{
  this.lstPlayers = [];
  this.lstRooms = [];
  this.PlayersModel = mongoose.model("PlayersModel", PlayersSchema);
}

MainApp.prototype.method = function(arg)
{
    let bySessionID = (elem) => {
        return elem.idSession === arg;
    };
  	let byPlayerName = (elem) => {
  			return elem.name === arg;
  	};
    let byRoomName = (elem) => {
  			return elem.roomName === arg;
  	};
    let isAlreadyInMap = (elem) => {
      if (elem.name === arg)
        return true;
      return false;
    };
    let roomExist = (elem) => {
      if (elem.roomName === arg)
        return elem;
      return null;
    };
    return {
      bySessionID    : bySessionID,
      byPlayerName   : byPlayerName,
      byRoomName     : byRoomName,
      isAlreadyInMap : isAlreadyInMap,
      roomExist      : roomExist
    };
};

MainApp.prototype.Init = function(io)
{
  io.on('connection', (client) => {
		client.on('leaderBoard', () => {
			this.sendBestPLayers((results) => {
				client.emit("leaderBoard", results);
			});
		});
  	client.on('firstConnect', (hash) => {
      this.newPlayerManager(hash, client.id).then( (player) => {
				this.newRoomManager(client, hash, player).then( (value) => {
					this.sendRoomInfo(io, player, value);
				}).catch( reason => {
					this.deletePlayer(player);
          client.emit("ConnexionError", reason);
				});
			}).catch( reason => {
        client.emit("ConnexionError", reason);
			});
  	});
    client.on('playerReady', () => {
      this.retrievePlayerAndRoom(client, false).then( (data) => {
        this.playerIsReady(io, data.player, data.room);
      }).catch(this.retrieveFailed.bind(null, client));
    });
		client.on('runNewGame', (data) => {
			this.runGame(io, client, data);
		});

		client.on("remoteMove", (data) => {
			this.remoteCommand(io, data);
		});

		client.on('requestPiece', (data) => {
			this.retrievePlayerAndRoom(client, true).then( (data) => {
			  this.piecesDispatcher(data.room, io, data.player);
			}).catch(this.retrieveFailed.bind(null, client));
    });

    client.on('spectreSent', (data) => {
      this.retrievePlayerAndRoom(client, true).then( (res) => {
        this.emitSpectreToAnyOne(io, data.map, res.room, data.id, data.player);
      }).catch(this.retrieveFailed.bind(null, client));
    });

    client.on('playerDefeat', (score) => {
      this.retrievePlayerAndRoom(client, true).then( (data) => {
        this.playerDefeat(io, data, score);
      }).catch(this.retrieveFailed.bind(null, client));
    });

    client.on('stopGame', () => {
      this.retrievePlayerAndRoom(client, true).then( (data) => {
        this.stopGameRequest(io, data);
      }).catch(this.retrieveFailed.bind(null, client));
    });
		client.on('lineMalus', (iArgs) => {
			this.retrievePlayerAndRoom(client, true).then( (data) => {
				this.generateMalus(client, data, iArgs.lines, iArgs.score);
			}).catch(this.retrieveFailed.bind(null, client));
		});

		client.on('sendMessage', (message) => {
			this.retrievePlayerAndRoom(client, false).then( (data) => {
				this.chatManager(io, message, data);
			}).catch(this.retrieveFailed.bind(null, client));
		});

  	client.on('disconnect', (data) => {
  	  this.playerLeave(io, client.conn.id);
  	});
  });
};

MainApp.prototype.retrieveFailed = function (client)
{
  let emitError = (msgObj) => {
    client.emit("RetrieveError", msgObj);
  };

  emitError({ErrorType : "NotFounded", ErrorMsg : "Can't retrieve player or room"});
};

MainApp.prototype.sendBestPLayers = function(cb)
{
		this.PlayersModel.find({}, 'name lastScore', (err, res) => {
		if (err)
		{
			cb(null);
		}

		let plArray = [];

		res.forEach( (elem) => {
			plArray.push({name : elem.name, score : elem.lastScore});
		});
		plArray.sort( (a, b) => {
			return b.score - a.score;
		});

		plArray = plArray.splice(0, 5);
		cb(plArray);
	});
};

MainApp.prototype.playerIsReady = function(io, player, room)
{
	let _countReady = () => {
		let readyIndex = 0;

		room.registeredPlayers.forEach( (elem) => {
			if (elem.isReady)
				readyIndex++;
		});
		return readyIndex;
	};

	if (room.running)
		return;

	if ((_countReady() >= 2 && room.admin.isReady === false && player !== room.admin) ||
			(_countReady() >= 3))
	{
		io.to(player.idSession).emit("ConnexionError", {ErrorType : "MaxPLayers", ErrorMsg : "Reached the maximum number of players"});
		return ;
	}
	room.readyPlayers++;

  player.isReady = true;
  this.sendRoomInfo(io, player, room);
};

MainApp.prototype.sendRoomInfo = function(io, player, room)
{
	let newSpectre = [];

	for (var i = 0; i < 10; i++) {
	  newSpectre[i] = [];
	  for (var b = 0; b < 20; b++) {
	    newSpectre[i][b] = "case";
	  }
	}

  let formatedArray = room.registeredPlayers.map( (elem) => {
      return {isReady   : elem['isReady'],
              hasLoose  : elem['hasLoose'],
              name      : elem['name'],
              admin     : room.admin.name,
		          spectre   : newSpectre};
  });
  io.in(room.roomName).emit("GameInfos", {players : formatedArray, gameState : room.running});
};


MainApp.prototype.retrievePlayerAndRoom = function(client, needRun)// if flag needRun is set true check that the game is running
{
	return new Promise((resolve, reject) => {
		let player = findPlayer(this.lstPlayers, client.id);
		if (player === undefined)
			return reject("player not found");

		let room = matchRoomWithPlayer(this.lstRooms, player.anchoredRoom);
		if (room === undefined)
			return reject("room not found");

		if (needRun && room.running === false)
			return reject("not a running game");
		return resolve({ room : room, player : player });
	});
};

// Player and Room creation //
MainApp.prototype.newPlayerManager = function(hash, id)
{
  return new Promise((resolve, reject) => {
		if (!hash || !hash.hasOwnProperty('login')
							|| !hash.hasOwnProperty('room'))
			return reject({ErrorType : "hash", ErrorMsg : "Error of Hash"});

    let name = hash.login;
    let player;

    if (!name)
      return reject({ErrorType : "hash", ErrorMsg : "Error in Hash"});

    if ((player = this.lstPlayers.find(this.method(name).isAlreadyInMap)) !== undefined)
    {
      if (player.anchoredRoom !== null)
      	return reject({ErrorType : "isAlreadyInMap", ErrorMsg : "Error player already registered"});
			else {
				this.deletePlayer(player);
			}
    }
    return resolve(this.createNewPlayer(name, id));
  });
};

MainApp.prototype.newRoomManager = function(client, hash, player)
{
	return new Promise((resolve, reject) => {
		let roomName = hash.room;

		if (!roomName)
			return reject({ErrorType : "hash", ErrorMsg : "Error in Hash"});

		let currRoom = this.lstRooms.find(this.method(roomName).roomExist);
		if (!currRoom)
		{
			currRoom = this.createNewRoom(roomName);
			currRoom.admin = player;
		}
		currRoom.registeredPlayers.push(player);
		player.anchoredRoom = currRoom.roomName;
		client.join(currRoom.roomName);
    return resolve(currRoom);
	});
};

MainApp.prototype.createNewPlayer = function(name, id)
{
  let newPlayer = new Player(name, id);

  this.lstPlayers.push(newPlayer);
  return newPlayer;
};

MainApp.prototype.createNewRoom = function(name)
{
  let newGame = new Game(name);

  this.lstRooms.push(newGame);
  return newGame;
};
// -------------- //

MainApp.prototype.playerDefeat = function(io, data, score)
{
	if (!data.room.running)
		return ;

	let iDel;

  data.player.saveScore(this.PlayersModel, score).then((res) => {
	}).catch( reason => {
	});

  data.player.hasLoose = true;
  data.player.isReady = false;

	if ((iDel = data.room.activesPlayers.findIndex(this.method(data.player.idSession).bySessionID)) >= 0)
		data.room.activesPlayers.splice(iDel, 1);

	if (data.room.activesPlayers.length === 1)//multiPLayers
	{
		io.to(data.room.activesPlayers[0].idSession).emit("gameWinner", data.room.activesPlayers[0].idSession);
		data.room.stopGame(io);
	}

	if (data.room.activesPlayers.length === 0)//onePLayer
		data.room.stopGame(io);
	this.sendRoomInfo(io, data.player, data.room);

	if (!data.room.running)
	{
		data.room.resetPlayers();
		this.sendRoomInfo(io, data.player, data.room);
	}
};

MainApp.prototype.stopGameRequest = function(io, data)
{
  if (data.room.admin !== data.player)
    return ;
  data.room.stopGame(io);
	data.room.resetPlayers();
	this.sendRoomInfo(io, data.player, data.room);
};

let matchRoomWithPlayer = (lstRooms, anchoredRoom) => {
	return lstRooms.find((element) => {
		return element.roomName === anchoredRoom;
	});
};

let findPlayer = (lstPlayers, id) => {
	let bySessionID = (elem) => {
		return elem.idSession === id;
  };
	return lstPlayers.find(bySessionID);
};

MainApp.prototype.runGame = function(io, client, data)
{
	let id = client.id;
	let player;
	let Room;

  if ((player = findPlayer(this.lstPlayers, id)) === undefined
    || (Room = matchRoomWithPlayer(this.lstRooms, player.anchoredRoom)) === undefined)
    return ;

	if (Room.running || Room.activesPlayers.length)
	{
		return ;
	}

	let _activatePlayers = () => {
		Room.registeredPlayers.forEach( ( elem ) =>{
			elem.hasLoose = false;
      if (elem.isReady)
        Room.activesPlayers.push(elem);
		});
	};

	let _activateGame = () => {
		Room.running = true;
	};

	if (Room.admin === player)
	{
		Room.piecesManager = new Piece();
		if (data.bonus)
			Room.piecesManager.bonus();
		_activatePlayers();
		_activateGame();
		this.piecesDispatcher(Room, io, null);
		this.sendRoomInfo(io, player, Room);
	}
};

MainApp.prototype.emitSpectreToAnyOne = function(io, map, room, id, player)
{
 	let col;
	let line = "";
  let newSpectre = [];
  let intermediate = [];

  for (let c = 0; c < 10; c++)
  {
    for (let l = 0; l < 20; l++)
    {
      if (map[c][l].length > 4)
      {
        intermediate.push("case bg-blk");
        break;
      }
      else {
        intermediate.push("case");
      }
    }
    newSpectre.push(intermediate);
		intermediate = [];
  }
  io.in(room.roomName).emit('spectreUpdated', { spectre : newSpectre, id : id, player: player });
	newSpectre.length = 0;
};

MainApp.prototype.generateMalus = function(client, data, lines, score)
{
	client.to(data.room.roomName).emit('generateMalus', lines - 1);
  client.to(data.room.roomName).emit('scoreUpdate', score, data.player.name);
};

MainApp.prototype.piecesDispatcher = function(Room, io, player)
{
	if (!player)
	{
		let pcsManager = Room.piecesManager;
		pcsManager.generate();
		io.in(Room.roomName).emit('pieceSent', pcsManager.getPiece);
	}
	else if (!player.hasLoose)
		Room.newPieceToPlayer(io, player);
};

MainApp.prototype.chatManager = function(io, message, data)
{
	io.in(data.room.roomName).emit('chatUpdate', message.message, data.player.name);
};

MainApp.prototype.remoteCommand = function(io, data)
{
	if (!data || !data.player || !data.room)
		return("undefined values");

	let player = this.lstPlayers.find(this.method(data.player).byPlayerName);
	let room	 = this.lstRooms.find(this.method(data.room).byRoomName);

	if (player === undefined || room === undefined)
		return ("bad Player or Room");

	io.to(player.idSession).emit("remoteCommand", {move : data.move});
};

MainApp.prototype.deletePlayer = function(player)
{
	this.lstPlayers.splice(this.lstPlayers.findIndex(this.method(player.playerName).byPlayerName), 1);
};

MainApp.prototype.deleteRoom = function(Room)
{
	this.lstRooms.splice(this.lstRooms.findIndex(this.method(Room.roomName).byRoomName), 1);
}

MainApp.prototype.playerLeave = function(io, id)
{
	let player;
	let currentRoom;
	let i;

	if ((player = findPlayer(this.lstPlayers, id)) === undefined)
		return ;
	if ((currentRoom = matchRoomWithPlayer(this.lstRooms, player.anchoredRoom)) === undefined)
  {
    this.deletePlayer(player);
    return ;
  }

	if ((i = currentRoom.registeredPlayers.findIndex(this.method(id).bySessionID)) !== -1)
		currentRoom.registeredPlayers.splice(i, 1);
	if ((i = currentRoom.activesPlayers.findIndex(this.method(id).bySessionID)) !== -1)
		currentRoom.activesPlayers.splice(i, 1);

	if (currentRoom.admin === player)
	{
		currentRoom.admin = currentRoom.registeredPlayers[0];
		if (currentRoom.running && currentRoom.admin && currentRoom.admin.isReady === false)
		{
			currentRoom.stopGame(io);
			currentRoom.resetPlayers();
			this.sendRoomInfo(io, currentRoom.admin, currentRoom);
		}
	}
	if (!currentRoom.registeredPlayers.length)
		this.deleteRoom(currentRoom);

	this.deletePlayer(player);

  if (currentRoom && currentRoom.admin)
    this.sendRoomInfo(io, currentRoom.admin, currentRoom);
};

module.exports = MainApp;

import {startServer, configureStore} from './helpers/server'
import rootReducer from '../src/client/reducers'
import io from 'socket.io-client'
import params from '../params'

let MainApp 		= require('../src/server/MainApp.js');
let Piece   		= require('../src/server/Piece.js');
let Player			= require('../src/server/Player.js');
let Game 				= require('../src/server/Game.js');
let	App					= require('../src/server/app.js');
let expect  		= require('expect.js');
const mongoose 	= require('mongoose');
const express		= require("express");
const app				= express();
const http			= require("http");
const server		= http.createServer(app);
let ioServer		= require('socket.io')(server, {
														pingInterval: 10000,
														pingTimeout: 50000,
														cookie: false
});
let options 		= {
  									transports: ['websocket'],
  									'force new connection': true
};

let socket;
let mainTest = new MainApp();

describe('PLayer&Room Creation', () => {
	it('should have create 1 player and 1 Room', (done) => {
		mainTest.newPlayerManager({login : 'fakeLogin', room : 'fakeRoom'}, "abcdef").then( (player) => {
			expect(mainTest.lstPlayers).to.have.length(1);
			mainTest.newRoomManager(ioServer, {login : 'fakeLogin', room : 'fakeRoom'}, player).then( (value) => {
				expect(mainTest.lstRooms).to.have.length(1);
				done();
			}).catch( reason => {
				done();
			});
		}).catch( reason => {
			done();
		});
	});

	it('should be again 1 player and 1 Room', (done) => {
		mainTest.newPlayerManager({login : 'fakeLogin', room : 'fakeRoom'}, "abcdef").then( (player) => {
			mainTest.newRoomManager(ioServer, {login : 'fakeLogin', room : 'fakeRoom'}, player).then( (value) => {
			}).catch( reason => {
				expect(mainTest.lstRooms).to.have.length(1);
				done();
			});
		}).catch( reason => {
			expect(reason.ErrorMsg).to.be("Error player already registered");
			done();
		});
	});

	it('should add 1 more player to Room 1', (done) => {
		mainTest.newPlayerManager({login : 'fakeLogin2', room : 'fakeRoom'}, "abcdef2").then( (player) => {
			expect(mainTest.lstPlayers).to.have.length(2);
			mainTest.newRoomManager(ioServer, {login : 'fakeLogin2', room : 'fakeRoom'}, player).then( (value) => {
				expect(mainTest.lstRooms).to.have.length(1);
				done();
			}).catch( reason => {
				done();
			});
		}).catch( reason => {
			done();
		});
	});

	it('should throw an Error in Hash', (done) => {
		mainTest.newPlayerManager({login : '', room : 'fakeRoom'}, "12341234").then( (player) => {
			expect(player).to.be.empty();
			done();
		}).catch( reason => {
			expect(reason.ErrorMsg).to.be("Error in Hash");
			expect(mainTest.lstRooms).to.have.length(1);
			expect(mainTest.lstPlayers).to.have.length(2);
			done();
		});
	});

	it('should throw an Error in Hash', (done) => {
		mainTest.newRoomManager(ioServer, {login : 'fakepl', room : ''}, "fakepl").then( (room) => {
			expect(room).to.be.empty();
			done();
		}).catch( reason => {
			expect(reason.ErrorMsg).to.be("Error in Hash");
			expect(mainTest.lstRooms).to.have.length(1);
			expect(mainTest.lstPlayers).to.have.length(2);
			done();
		});
	});

	it('should detect already registered player', (done) => {
		mainTest.newPlayerManager({login : 'fakeLogin', room : 'fakeRoom'}).then( (player) => {
			expect(player).to.be.empty();
			done();
		}).catch( reason => {
			expect(reason.ErrorMsg).to.be("Error player already registered");
			expect(mainTest.lstRooms).to.have.length(1);
			expect(mainTest.lstPlayers).to.have.length(2);
			done();
		});
	});

	it('should recreate player', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef"}, false).then( (res) => {
			res.player.anchoredRoom = null;
			mainTest.newPlayerManager({login : 'fakeLogin', room : 'fakeRoom'}, 'abcdef').then( (player) => {
				expect(player).not.to.be.empty();
				player.anchoredRoom = 'fakeRoom';
				res.room.admin = player;
				done();
			}).catch( reason => {
				expect(reason).to.be.empty();
				done();
			});
		}).catch(reason => {
			done();
		});
	});
});

describe('change player to ready', () => {
	it('should set player as ready', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef"}, false).then( (res) => {
			expect(res).to.have.property('room');
			expect(res).to.have.property('player');
			res.room.running = true;
			mainTest.playerIsReady(ioServer, res.player, res.room);
			expect(res.player.isReady).to.be(false);
			res.room.running = false;
			mainTest.playerIsReady(ioServer, res.player, res.room);
			expect(res.player.isReady).to.be(true);
			done();
		}).catch(reason => {
			expect(reason).to.be.empty();
			done();
		});
	});
});

describe('startGame', (done) => {

	it ('should reject bad player', () => {
		mainTest.runGame(ioServer, {id : "badID"}, {bonus : false});
		mainTest.lstRooms.forEach( (e) => {
			expect(e.running).to.be(false);
		});
	});

	it('should reject not admin player', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef2"}, false).then( (res) => {
		mainTest.runGame(ioServer, {id  : "abcdef2"}, {bonus : false});
		expect(res.room.running).to.be(true);
		done();
	}).catch(reason => {
		expect(reason).to.be.empty();
		done();
	});
	});

	it('should start the game and set the boolean', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef"}, false).then( (res) => {
			res.room.registeredPlayers.forEach( (elem) => {
				mainTest.playerIsReady(ioServer, elem, res.room);
			});
			mainTest.runGame(ioServer, {id : "abcdef"}, {bonus : false});
			expect(res.room.running).to.be(true);
			res.room.registeredPlayers.forEach( (pl) => {
				expect(pl.hasLoose).to.be(false);
			});
			expect(res.room.activesPlayers).to.be(res.room.registeredPlayers);
			done();
		}).catch(reason => {
			expect(reason).to.be.empty();
			done();
		});
	});
});

describe('playerDefeat', (done) => {

	it('should return because game not running', () => {
		let room = mainTest.lstRooms[0];
		let player = room.admin;
		room.running = false;
		mainTest.playerDefeat(ioServer, {player : player, room : room}, 1000);
		expect(player.hasLoose).to.be(false);
	});
	it('should create a third player', (done) => {
		let room = mainTest.lstRooms[0];
		mainTest.newPlayerManager({login : 'fakeLogin3', room : 'fakeRoom'}, 'abcdefrt').then( (player) => {
			expect(player).not.to.be.empty();
			player.anchoredRoom = 'fakeRoom';
			room.registeredPlayers.push(player);
			mainTest.playerIsReady(ioServer, player, room);
			room.activesPlayers.push(player);
			room.running = true;
			done();
		}).catch( reason => {
			expect(reason).to.be.empty();
			done();
		});
	});
	it('should DEFEAT player', () => {
		let room = mainTest.lstRooms[0];
		let player;
		expect(room.activesPlayers).to.have.length(3);
		player = room.activesPlayers[0];
		mainTest.playerDefeat(ioServer, {player : player, room : room}, 1000);

		player = room.activesPlayers[0];
		mainTest.playerDefeat(ioServer, {player : player, room : room}, 1000);
		expect(room.activesPlayers).to.be.empty();

		player = room.registeredPlayers[0];
		mainTest.playerDefeat(ioServer, {player : player, room : room}, 1000);
		expect(room.activesPlayers).to.be.empty();

		room.running = true;
		mainTest.playerDefeat(ioServer, {player : player, room : room}, 1000);
		expect(room.activesPlayers).to.be.empty();

		room.registeredPlayers.forEach( (pl) => {
			expect(pl.hasLoose).to.be(false);
		});
	});
});

describe('stopGame', () => {
	it ('should not stopGame  because player is not admin', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef2"}, false).then( (res) => {
			mainTest.runGame(ioServer, {id : "abcdef2"}, {bonus : false});
			expect(res.room.running).to.be(false);
			mainTest.stopGameRequest(ioServer, res);
			expect(res.room.running).to.be(false);
			done();
			}).catch(reason => {
				expect(reason).to.be.empty();
				done();
		});
	});

	it ('should stop the game because player is admin', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef"}, false).then( (res) => {
			mainTest.runGame(ioServer, {id : "abcdef"}, {bonus : false});
			expect(res.room.running).to.be(true);
			mainTest.stopGameRequest(ioServer, res);
			expect(res.room.running).to.be(false);
			done();
			}).catch(reason => {
				expect(reason).to.be.empty();
				done();
		});
	});
});

describe('emitSpectre', () => {
	it('should create SpectreMap', () => {
		let fakeMap = [
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, "5length", 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
										[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
									];
		let room = mainTest.lstRooms[0];
		let player = mainTest.lstPlayers[0];
		let id = player.idSession;
		mainTest.emitSpectreToAnyOne(ioServer, fakeMap, room, id, player);
	});
});

describe("Generate Malus", () => {
	it('should generate malus', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef"}, false).then( (res) => {
			mainTest.generateMalus(ioServer, res, 2, 1000);
			//  //!!\\	rajouter le client IO
			done();
		}).catch( reason => {
			expect(reason).to.be.empty();
			done();
		});
	});
});

describe('remoteMove', () => {
	it('should not crash', () => {
		let returnValue = mainTest.remoteCommand(ioServer);
		expect(returnValue).to.be("undefined values");
	});

	it ('should send an error', () => {
		let returnValue = mainTest.remoteCommand(ioServer, {player : "test", room : "test"});
		expect(returnValue).to.be("bad Player or Room");
	});

	it ('should send a remoteCommand', () => {
		let returnValue = mainTest.remoteCommand(ioServer, {player : "fakeLogin2", room : "fakeRoom"});
		expect(returnValue).to.be(undefined);
		//check IO here
	});
});

describe("pieces Dispatcher", () => {
	it("should generage piece", () => {
		let room = mainTest.lstRooms[0];
			room.registeredPlayers.forEach( (elem) => {
			mainTest.playerIsReady(ioServer, elem, room);
		});
		mainTest.runGame(ioServer, {id : "abcdef"}, {bonus : true});
		let player = mainTest.lstRooms[0].registeredPlayers[0];
		mainTest.piecesDispatcher(room, ioServer, null);
		mainTest.piecesDispatcher(room, ioServer, player);
		mainTest.playerDefeat(ioServer, {player : player, room : room}, 1000);
		mainTest.piecesDispatcher(room, ioServer, player);
	});
});

describe("chatManager", () => {
	it('should send and receive Messages', () => {
		let room = mainTest.lstRooms[0];
		let player = room.registeredPlayers[0];
		mainTest.chatManager(ioServer, "Hello from Client", {room : room, player : player});
	});
});

describe('retrievePlayer&Room', () => {
	it ('should retrieve Player and Room', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef"}, false).then( (res) => {
			expect(res.room).to.be.an('object');
			expect(res.player).to.be.an('object');
			res.room.stopGame(ioServer);
			done();
		}).catch(reason => {
			expect(reason).to.be.empty();
			done();
		});
	});

	it('should throw an Error not a running game', (done) => {
		mainTest.retrievePlayerAndRoom({id : "abcdef"}, true).then( (res) => {
			expect(res).to.be.empty();
			done();
		}).catch(reason => {
			expect(reason).to.be('not a running game');
			done();
		});
	});

	it('should throw an Error room not found', (done) => {
		let room = mainTest.lstRooms[0];
		mainTest.deleteRoom(room);
		mainTest.retrievePlayerAndRoom({id : "abcdef"}, true).then( (res) => {
			done();
		}).catch(reason => {
			expect(reason).to.be('room not found');
			done();
		});
	});

	it('should throw an Error player not found', (done) => {
		let player = mainTest.lstPlayers[0];
		mainTest.deletePlayer(player);
		mainTest.retrievePlayerAndRoom({id : "abcdef2"}, false).then( (res) => {
			done();
		}).catch(reason => {
			expect(reason).to.be('player not found');
			done();
		});
	});
});

describe('deletePlayer', () => {
	it('lstPlayers should be empty', () => {
		while (mainTest.lstPlayers[0])
			mainTest.deletePlayer(mainTest.lstPlayers[0]);
		expect(mainTest.lstPlayers).to.have.length(0);
	});
});

describe('deleteRoom', () => {
	it('lstRooms should be empty', () => {
		let test1 = mainTest.createNewRoom("roomtst");
		mainTest.deleteRoom(test1);
		expect(mainTest.lstRooms).to.have.length(0);
	});
});

describe('playerLeave', () => {
	let player1;
	let player2;
	let player3;
	let room;

	it('should create elements', (done) => {
		player1 = mainTest.createNewPlayer("fakePl", "abcdef");
		player2 = mainTest.createNewPlayer("fakePl2", "abcdefg");
		player3 = mainTest.createNewPlayer("fakePl3", "abcdefgh");
		room = mainTest.createNewRoom("fakeRoom");
		done();
	});

	it('should have 3 player and 1 room rm admin and change it', () => {
		player1.anchoredRoom = "fakeRoom";
		player2.anchoredRoom = "fakeRoom";
		room.registeredPlayers.push(player1, player2);
		room.activesPlayers.push(player1, player2);
		room.admin = player1;
		expect(mainTest.lstPlayers).to.have.length(3);
		expect(room.admin).to.be(player1);
		mainTest.playerLeave(ioServer, player1.idSession);
		expect(room.admin).to.be(player2);
		expect(room.registeredPlayers).to.have.length(1);
		expect(room.activesPlayers).to.have.length(1);
		expect(mainTest.lstPlayers).to.have.length(2);
	});

	it('should rm only player', () => {
		mainTest.playerLeave(ioServer, player3.idSession);
		expect(room.admin).to.be(player2);
		expect(room.registeredPlayers).to.have.length(1);
		expect(room.activesPlayers).to.have.length(1);
		expect(mainTest.lstPlayers).to.have.length(1);
	});

	it('should delete room', () => {
		mainTest.playerLeave(ioServer, player2.idSession);
		expect(mainTest.lstRooms).to.be.empty();
	});

	it ('should not find player', () => {
		mainTest.playerLeave(ioServer, "fakeID");
	});
});

describe("max 3 players", () => {
	let player1;
	let player2;
	let player3;
	let player4;
	let room;
	let reset = (players) => {
		players.forEach( (e) => {
			e.isReady = false;
		});
	}
	it('should create elements', (done) => {
		player1 = mainTest.createNewPlayer("fakePl", "abcdef");
		player2 = mainTest.createNewPlayer("fakePl2", "abcdefg");
		player3 = mainTest.createNewPlayer("fakePl3", "abcdefgh");
		player4 = mainTest.createNewPlayer("fakePl4", "abcdefghi");
		room = mainTest.createNewRoom("fakeRoom");
		room.registeredPlayers.push(player1, player2, player3, player4);
		room.admin = player1;
		done();
	});

	it('should accept max 3 players', () => {
		mainTest.playerIsReady(ioServer, player1, room);
		mainTest.playerIsReady(ioServer, player2, room);
		mainTest.playerIsReady(ioServer, player3, room);
		mainTest.playerIsReady(ioServer, player4, room);

		expect(player4.isReady).to.be(false);
		reset([player1, player2, player3]);
	});

	it('should wait for admin', () => {
		mainTest.playerIsReady(ioServer, player2, room);
		mainTest.playerIsReady(ioServer, player3, room);
		mainTest.playerIsReady(ioServer, player4, room);

		expect(player4.isReady).to.be(false);
		reset([player4, player2, player3]);
	});

});

describe("sendBestPLayers", () => {
		it('should send bests players', () => {
			mainTest.sendBestPLayers( (players) => {
			});
		});
});

describe("errorCatch", () => {
	it('should emit an error', () => {
		mainTest.retrieveFailed(ioServer);
	});
});
//PieceTest
let PieceTest = new Piece();

describe('Piece Class', () => {
		it('should have length of two', () => {
			PieceTest.generate();
			expect(PieceTest.getPiece).to.have.length(2);
		});

		it('should have length of three', () => {
			PieceTest.generate();
			expect(PieceTest.getPiece).to.have.length(3);
		});

		it('should have length of 0', () => {
			PieceTest.shiftPcsBuff();
			PieceTest.shiftPcsBuff();
			PieceTest.shiftPcsBuff();
			expect(PieceTest.getPiece).to.have.length(0);
		});
});
//END

//PlayerTest

let PlayerTest = new Player("tstPl", "1234");

describe('Player Class', () => {

	before( (done) => {
		mongoose.connect('mongodb://127.0.0.1:27017/redtetris', (err) => {
			let deleteReturn = (err, res) => {
			};
			mainTest.PlayersModel.remove({name : 'tstPl'}, deleteReturn);
			mainTest.PlayersModel.remove({name : 'test1wef'}, deleteReturn);
			mainTest.PlayersModel.remove({name : 'fakeLogin'}, deleteReturn);
			mainTest.PlayersModel.remove({name : 'fakeLogin2'}, deleteReturn);

			done();
		});
	});

		it('should return `tstPl`', () => {
			expect(PlayerTest.playerName).to.be('tstPl');
		});

		it('should reset player', () => {
			PlayerTest.reset();
			expect(PlayerTest.posInPieceLst).to.be(1);
			expect(PlayerTest.hasLoose).to.be(false);
			expect(PlayerTest.isReady).to.be(false);
		});

		it ('should increase posInPieceLst', () => {
			PlayerTest.newPiece();
			expect(PlayerTest.posInPieceLst).to.be(2);
		});
		it ('should decrease posInPieceLst', () => {
			PlayerTest.decreasePosInPieceLst();
			expect(PlayerTest.posInPieceLst).to.be(1);
		});

		it ('should save Score without error', (done) => {
			PlayerTest.saveScore(mainTest.PlayersModel, 1000).then((res) => {
				expect(res).to.be.an('array');
				done();
			}).catch(reason => {
				expect(reason).to.be.empty();
				done();
			});
		});

		it ('should not update Score', (done) => {
			PlayerTest.saveScore(mainTest.PlayersModel, 1000).then((res) => {
				expect(res).to.be('score Not Updated');
				done();
			}).catch(reason => {
				expect(reason).to.be.empty();
				done();
			});
		});
		it ('should update Score without error', (done) => {
			PlayerTest.saveScore(mainTest.PlayersModel, 4000).then((res) => {
				expect(res).to.be.an('array');
				done();
			}).catch(reason => {
				expect(reason).to.be.empty();
				done();
			});
		});
});
//END

let GameTest = new Game("fakeGame");
let PlayerTest2 = new Player("fakePlayer", "idTest1");
let PlayerTest3 = new Player("fakePlayer2", "idTest2");
describe('Game Class', () => {
	it ('should do nothig', (done) => {
		GameTest.newPieceToPlayer(ioServer, PlayerTest2);
		done();
	});
	it ('should return', (done) => {
		GameTest.running = true;
		GameTest.piecesManager = PieceTest;
		GameTest.activesPlayers.push(PlayerTest2, PlayerTest3);
		GameTest.newPieceToPlayer(ioServer, PlayerTest2);
		done();
	});
	it ('should manipInterval', () => {
		GameTest.totalPcsCount = 29;
		GameTest.newPieceToPlayer(ioServer, PlayerTest2);
	});

	it('should not push already in ID', () => {
		GameTest.playerRequestNewPiece("idTest1");
		expect(GameTest.piecesManager.idReg).to.have.length(1);
	});

	it('should reset idReg ', () => {
		GameTest.newPieceToPlayer(ioServer, PlayerTest3);
		expect(GameTest.piecesManager.idReg).to.have.length(0);
	});

	it('should dont generate for the last piece', () => {
		GameTest.newPieceToPlayer(ioServer, PlayerTest2);
		GameTest.newPieceToPlayer(ioServer, PlayerTest2);
		GameTest.newPieceToPlayer(ioServer, PlayerTest2);
		GameTest.newPieceToPlayer(ioServer, PlayerTest2);
		let count = GameTest.totalPcsCount;
		GameTest.newPieceToPlayer(ioServer, PlayerTest3);
		expect(GameTest.totalPcsCount).to.be(count);
	});
});

describe('app', () => {
	before(() => {
		global.res = {
			writeHead: (code) => {
				return code
			},
			end: (data) => {
				return data
			}
		}
	})
	it ('app coverage', (done) => {
		let loadingIndex = App.get();
		let readfile = loadingIndex();

		readfile(res, true, {});
		done();
	});
});

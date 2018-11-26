import rootReducer	from '../src/client/reducers'
import reducers		from '../src/client/reducers'
import thunk		from 'redux-thunk'
import React from 'react'

import chai		from "chai"
import _		from 'lodash'
import {pieces}	from '../src/client/reducers/listPieces'

import Enzyme, { render, shallow } from 'enzyme'

import {
	initPiece, initTetris, updateTetris, updateFixedTetris, catchUpdateTetris, putInMap, applyMalus, rotate, gameStart, gameStop, gamePlayers, gameSpectreApply, gameSpectreView, gameScoreApply, upAllPieces, gameUpdateChat, gameLeaderboard
} from '../src/client/actions'

import {
	GAME_START, GAME_STOP, GAME_PLAYERS, GAME_VIEW, GAME_CHAT_UPDATE,  INIT_PIECE, INIT_TETRIS, UPDATE_TETRIS, UPDATE_FIXED_TETRIS
} from '../src/client/actions'

import App, {rotate as rotateTetrimino, verifyTetris, deleteLine,
	setAsFixed, isLegal, turnPiece, requestPiece, sendSpectre,
	thisPartyInformation, startGame, createPiece, readyToPlay, startNewGame,
	handleLogin, handleRoom, handleMessage,
	mapStateToProps, parseUrlAndStore, goFunction, initParty, sendMessage, ifRestart, checkIfUrlChange, putIntervalIfNot, key, myFunc,
	updateInterval, gameOver, gameWinner, connexionError, mobileController, leaderboardGet, generateMalus
} from '../src/client/containers/App'

import socketMiddleware from '../src/client/middlewares/socketMiddleware'

import Application, {mapStateToProps as mapStateToProps2} from '../src/client/components/application'
import Mobile, {clickLeft, clickRight, clickFall, clickBottom, clickRotate, parseUrl} from '../src/client/containers/Mobile'

import {createRenderer} from 'react-addons-test-utils'
import ReactTestUtils from 'react-addons-test-utils'
import equalJSX from 'chai-equal-jsx'

import io				from 'socket.io-client'
import configureStore	from 'redux-mock-store'

const middlewares	= [thunk]
const mockStore		= configureStore(middlewares)
const assert		= require('chai').assert

let initialState
let store

import Adapter from 'enzyme-adapter-react-15';
Enzyme.configure({ adapter: new Adapter() })

global.shallow = shallow;

chai.use(equalJSX)

const tetrimino		= {
	b: [
		[0, 0, 0],
		[0, 1, 1],
		[1, 1, 0],
	],
	color: 'grn'
};

const	spectre	= () => {
	let map = [];

	map = [];
	for (var i = 0; i < 10; i++) {
		map[i] = [];
		for (var b = 0; b < 20; b++) {
			map[i][b] = "case";
		}
	}
	return map;
}
const	players	= [
	{
		admin: 'test',
		hasLoose: false,
		isReady: true,
		name: 'test',
		spectre: spectre
	}
]
const	tetris	= spectre();

let		socket

chai.should()


describe('reducers', () => {
	describe('game', () => {
		it ('should start the game', done => {
			let test = reducers({}, {type: 'GAME_START' });

            assert.equal(true, _.isEqual(test.game, { started: true, players: [], viewInt: -1, messages: [], leaderboard: [] } ) );
			done()
		})
		it ('should stop the game', done => {
			let test = reducers({}, {type: 'GAME_STOP' });

            assert.equal(true, _.isEqual(test.game, { started: false, players: [], viewInt: -1, messages: [], leaderboard: [] } ) );
			done()
		})
		it ('should update all players ingame', done => {
			let test = reducers({}, {type: 'GAME_PLAYERS', players, isAdmin: 'test', gameState: false});

			assert.equal(true, _.isEqual(test.game, {
				started: false,
				players: [
					{
						admin: 'test',
						hasLoose: false,
						isReady: true,
						name: 'test',
						spectre: spectre
					}
				],
				viewInt: -1,
				messages: [],
				isAdmin: 'test',
				gameState: false,
				leaderboard: []
			}));
			done()
		})
		it ('should update the piece', done => {
			let test = reducers({}, {type: 'INIT_PIECE' });

			assert.equal(true, _.isEqual(test.movement, {
					allPieces: pieces,
					piece: undefined,
					tetris: [],
					fixedTetris: [],
					nextpiece: {}
				}
			));
			done()
		})
		it ('should update spectre view', done => {
			let test = reducers({}, {type: 'GAME_VIEW', view: 1 });

			assert.equal(true, _.isEqual(test.game, { started: false, players: [], viewInt: 1, messages: [], leaderboard: [] }));
			done()
		})
		it ('should update chat', done => {
			let test = reducers({}, {type: 'GAME_CHAT_UPDATE', message: 'test', from: 'test' });

			assert.equal(true, _.isEqual(test.game, {
				started: false,
				players: [],
				viewInt: -1,
				messages: [ { text: 'test', from: 'test' } ],
				leaderboard: []
			}));
			done()
		})
	})
});

describe('actions', () => {
	it ('should stop the game', done => {
		let test = gameStop({started: false});

		assert.equal(true, _.isEqual(test, { type: 'GAME_STOP', creds: { started: false } }))
		done()
	})
	it ('should update the players', done => {
		let test = gamePlayers(players, 'test', false);

		assert.equal(true, _.isEqual(test, {
			type: 'GAME_PLAYERS',
			players: [{
				admin: 'test',
				hasLoose: false,
				isReady: true,
				name: 'test',
				spectre: spectre
			}],
			isAdmin: 'test',
			gameState: false
		}))
		done()
	})
	it ('should change spectre to viewers', done => {
		let test = gameSpectreView(0);

		assert.equal(true, _.isEqual(test, { type: 'GAME_VIEW', view: 0 }))
		done()
	})
	it ('should update player\'s score', done => {
		let test = gameScoreApply({player: 'test', score: 0});
		// assert.equal(true, _.isEqual(test, board))
		done()
	})
	it ('should update the chat', done => {
		let test = gameUpdateChat({message: '', player: 'test'});
		done()
	})
	it ('should update the leaderboard', done => {
		let test = gameLeaderboard([{name: 'test', score: 120}]);

		assert.equal(true, _.isEqual(test, { type: 'GAME_LEADERBOARD', data: [ { name: 'test', score: 120 } ] }))
		done()
	})
	it ('should up pieces', done => {
		let test = upAllPieces();
		// assert.equal(true, _.isEqual(test, board))
		done()
	})
	it ('should apply malus', done => {
		let test = applyMalus(spectre);

		// assert.equal(true, _.isEqual(test, board))
		done()
	})
	it ('should test variable', done => {
		let test = GAME_START;

		assert.equal(true, _.isEqual(test, "GAME_START"))
		done()
	})
	it ('should rotate the piece', done => {
		let test = rotate(tetrimino.b, 1);

		assert.equal(true, _.isEqual(test, [
			[ 0, 1, 1 ],
			[ 1, 1, 0 ],
			[ 0, 0, 0 ]
		]))
		done()
	})
	it ('should catch the tetris', done => {
		let test = catchUpdateTetris(tetris, tetrimino);
		// assert.equal(true, _.isEqual(test, board))
		done()
	})
	it ('should update the tetris', done => {
		let test = updateTetris(tetris);

		assert.equal(true, _.isEqual(test, { type: 'UPDATE_TETRIS', tetris: tetris, piece: undefined }))
		done()
	})
	it ('should update the fixedTetris', done => {
		let test = updateFixedTetris();
		// assert.equal(true, _.isEqual(test, board))
		done()
	})
	describe('player in store', () => {
		const initialState = {game: {players}, movement: {fixedTetris: tetris, tetris: tetris}}
		const store = mockStore(initialState);

		it ('should apply spectre to players', done => {
			store.dispatch(gameSpectreApply({player: players, score: 0}))

			const actions = store.getActions()
			done()
		})
		it ('should apply spectre to players', done => {
			store.dispatch(gameScoreApply({player: players, score: 130}))

			const actions = store.getActions()
			done()
		})
		it ('should apply upallPieces', done => {
			store.dispatch(upAllPieces())
			const actions = store.getActions()

			done()
		})
		it ('should apply initTetris', done => {
			store.dispatch(initTetris())

			const actions = store.getActions()
			done()
		})
		it ('should put the piece in tetris', done => {
			store.dispatch(putInMap(tetris, tetrimino.b, {position: {x: 0, y: 0}, rotation: 1}, 'blk'));

			const actions = store.getActions()
			done()
		})
	})
})

describe('app', () => {
	before(done => {
		initialState = {game: {players}, movement: {fixedTetris: tetris, tetris: tetris}}
		store = mockStore(initialState);

		socket = io.connect('http://localhost:8080');
		global.socket = socket;
		socket.on('connect', () => {
			socket.emit('firstConnect', {room: 'test1ewfw', login: 'test1wef'})
			done()
		})
	})
	after(done => {
		socket.emit('disconnect');
		done();
	})

	describe('system', () => {
		it ('should simulate a new game', done => {
			socket.emit("runNewGame", {room: 'test1ewfw', login: 'test1wef'});
			done();
		})
		it ('should return information', done => {
			let test = thisPartyInformation();
			done();
		})
		it ('should ready player', done => {
			readyToPlay(store);
			done();
		})
		it ('should start a new game', done => {
			startNewGame(store);
			done();
		})
		it ('should return information', done => {
			startGame(store);
			done();
		})
		it ('should rotate the piece', done => {
			rotateTetrimino(tetrimino.b, 1);
			done()
		})
		it ('should turn a piece', done => {
			turnPiece(store, 'top', null);
			done()
		})
		it ('should turn a piece', done => {
			turnPiece(store, 'left', {position: {x: 5, y: 5}, rotation: 1, model: 'l'});
			done()
		})
		it ('should turn a piece', done => {
			store.dispatch(initPiece({position: {x: 5, y: 5}, rotation: 0, model: 'o'}));
			turnPiece({piece: {position: {x: 5, y: 5}, rotation: 0, model: 'o'}, allPieces: pieces, game: {started: true}}, "left", null, true);
			done()
		})

		it ('should turn a piece', done => {
			turnPiece({piece: {position: {x: 2, y: 5}, rotation: 0, model: 'o'}, allPieces: pieces, game: {started: true}}, "rotate", null, true);
			done()
		})
		it ('should delete line', done => {
			deleteLine(tetris, 1);
			done()
		})
		it ('should verify tetris', done => {
			verifyTetris(tetris, 1, store);
			done()
		})
		it ('should setAsFixed a piece', done => {
			global.document = { querySelectorAll: () => { return [ { getAttribute: () => 0, }, { getAttribute: () => 0, }, { getAttribute: () => 0, }, { getAttribute: () => 0, }, ] } }

			setAsFixed(store, tetris);
			done()
		})
		it ('should verify setasfixed is legal', done => {
			isLegal(tetris, tetrimino.b, {position: {x: 0, y: 0}, rotation: 1}, 'blk');
			done()
		})
		it ('shoud create piece', done => {
			createPiece(store, 'l', tetris, pieces)
			done()
		})

		it ('shoud handle login', done => {
			let test = handleLogin({target: {value: "TEST"}});
			done()
		})
		it ('shoud handle room', done => {
			let test = handleRoom({target: {value: "TEST"}});
			done()
		})
		it ('shoud handle message', done => {
			let test = handleMessage({target: {value: "TEST"}});
			done()
		})
		it ('shoud check mapStateToProps', done => {
			mapStateToProps({
				movement: {
					allPieces: pieces,
					piece: undefined,
					tetris: [],
					fixedTetris: [],
				},
				game: { started: true, players: [], viewInt: -1, messages: [] }
			});
			done()
		})
		it ('shoud handle parseUrlAndStore', done => {
			global.window = {location: {href: "http://localhost:8080/#wfwef[test]"}}
			parseUrlAndStore(store);
			done()
		})
		it ('shoud handle goFunction', done => {
			global.window = {location: {href: "http://localhost:8080/#wfwef[test]"}}
			goFunction(store);
			done()
		})
		it ('shoud initparty', done => {
			initParty(store);
			done()
		})
		it ('shoud handle', done => {
			global.document = {
				getElementById: () => { return {value: 'test'} }
			}
			sendMessage(store);
			done()
		})
		it ('shoud set the player as over', done => {
			socket.on('gameOver', () => {
				done()
			});
			socket.emit('playerDefeat', 0)
		})

		it ('shoud check mapStateToProps', done => {
			mapStateToProps2({
				movement: {
					allPieces: pieces,
					piece: undefined,
					tetris: [],
					fixedTetris: [],
				},
				game: { started: true, players: [], viewInt: -1, messages: [] }
			});
			done()
		})

		it ('should show the signin w/ leaderboard', done => {
			let test = {
				allPieces: pieces,
				fixedTetris: tetris,
				tetris,
				game: { started: false, players: [], viewInt: -1, messages: [] },
				party: {
					defeat:false,
					gameInfos:true,
					interval:1000,
					login:false,
					malus:0,
					room:false,
					score:0,
					started:false,
				},
				piece: undefined,
			}

			const wrapper = render(<Application store={store} tetris={['10', '10']} messages={[]}
				piece={test.piece} party={test.party} game={{messages: [{from: 'ok', text: 'test'}]}}
				leaderboard={[{name: 'test', score: '200'}]}/>);
			done()
		})

		it ('shoud', done => {
			let test = {
				allPieces: pieces,
				fixedTetris: tetris,
				tetris,
				game: { started: true, players: [], viewInt: -1, messages: [] },
				party: {
					defeat:false,
					gameInfos:true,
					interval:1000,
					login:"reg",
					malus:0,
					room:true,
					score:0,
					started:false,
				},
				piece: undefined,
			}

			const wrapper = render(<Application store={store} tetris={['10', '10']} messages={[]}
				piece={test.piece} party={test.party} game={{messages: [{from: 'ok', text: 'test'}]}}
				leaderboard={[{name: 'test', score: '200'}]}/>);
			done()
		})
		it ('shoud', done => {

			let test = {
				allPieces: pieces,
				fixedTetris: tetris,
				tetris,
				game: { started: true, players: [], viewInt: -1, messages: [] },
				party: {
					defeat:false,
					gameInfos:true,
					interval:1000,
					login:"reg",
					malus:0,
					room:true,
					score:0,
					started:false,
				},
				piece: undefined,

			}

			const wrapper = render(<Application store={store} party={{room: 'ok'}} messages={[]}/>);
			done()
		})

		it ('should send a spectre', done => {
			ifRestart();
	  		done()
		})
		it ('should send a spectre', done => {
			checkIfUrlChange(store, {room: 'test', login: 'test'});
	  		done()
		})
		it ('should send a spectre', done => {
			putIntervalIfNot(store, {room: 'test', login: 'test'});
	  		done()
		})
		it ('should send a spectre', done => {
			key(store, {keyCode: 37});
	  		done()
		})
		it ('should send a spectre', done => {
			myFunc(37, store);
	  		done()
		})

		it ('should', done => {
			const wrapper = render(<Mobile />);
	  		done()
		})

		it ('should be ok', done => {
			clickLeft();
			done();
		})
		it ('should be ok', done => {
			clickRight();
			done();
		})
		it ('should be ok', done => {
			clickRotate();
			done();
		})
		it ('should be ok', done => {
			clickBottom();
			done();
		})
		it ('should be ok', done => {
			clickFall();
			done();
		})
		it ('should update interval', done => {
			updateInterval();
			done();
		})
		it ('should gameOver', done => {
			gameOver(store);
			done();
		})
		it ('should gameWinner', done => {
			gameWinner();
			done();
		})
		it ('should connexionError', done => {
			global.alert = (txt) => {}
			connexionError({ErrorMsg: 'test'});
			done();
		})
		it ('should check mobile with good url', done => {
			mobileController({room: 'test', login: 'test'});
			done();
		})
		it ('should check mobile with error url', done => {
			mobileController({});
			done();
		})

		it ('should be ok', done => {
			global.window = {location: {href: "http://localhost:8080/#(mobile)test[test]"}}
			parseUrl();
			done();
		})
		it ('should update the leaderboard', done => {
			let test = leaderboardGet(store);
			done()
		})
		it ('should no generate malus', done => {
			let test = generateMalus(0);
			done()
		})
	})

	describe('middlewares', () => {
		it ('should test the middleware', done => {
			const nextArgs = [];
			const fakeNext = (...args) => { nextArgs.push(args); };

			const action = { type: 'GAME_SOCKET' };
			socketMiddleware(socket)(store)(fakeNext)(action)
			done();
		})
		it ('should test the middleware without socket', done => {

			const nextArgs = [];
			const fakeNext = (...args) => { nextArgs.push(args); };
			const action = { type: 'GAME_START' };

			socketMiddleware(socket)(store)(fakeNext)(action)
			done();
		})
	})
})

import React from 'react';
import _ from 'lodash';
import {Header} from '../components/header'

import { initTetris, updateFixedTetris, updateNextPiece, putInMap, gameStart,
	gameStop, gamePlayers, gameSpectreApply, gameScoreApply, upAllPieces, gameUpdateChat, getUpdatedProps, gameLeaderboard, gameSocket } from '../actions'

import { connect } from 'react-redux'
import Application from '../components/application'

import io			from 'socket.io-client'
import {configs}	from '../params'

let _NOT_SET = false;
let _INTERVAL = false;
let _Leaderboard = false;
let link

let _Piece = {
	sent: false,
	block: false,
	y: 0,
}
let _Party = {
	started: false,
	defeat: false,
	interval: 1000,
	malus: 0,
	score: 0
}

export const setAsFixed = (props, fixedTetris) => {
	const piece		= document.querySelectorAll('.active')
	let tetris		= _.map(props.fixedTetris, _.clone);

	if (fixedTetris)
		tetris = fixedTetris;

	_Piece.block = false;
	for (var i = 0; i < piece.length; i++) {
		let color = piece[i].getAttribute('class');

		color = color.substring && color.substring(4, 11);
		tetris[piece[i].getAttribute('y')][piece[i].getAttribute('x')] = "case "+color
		if (piece[i].getAttribute('x') === '0') {
			_Party.defeat = true;
			clearInterval(_INTERVAL);
			// socket.emit('playerDefeat', _Party.score)
			props.dispatch(gameSocket('playerDefeat', _Party.score))
			alert("Vous avez perdu");
			return ;
		}
	}
	clearInterval(_INTERVAL);
	_NOT_SET = false;
	tetris = verifyTetris(_.map(tetris, _.clone), 0, props);
	props.dispatch(updateFixedTetris(tetris));
	requestPiece(props);
	sendSpectre(tetris, props);
}

export const isLegal = (tetris, p, piece, color) => {
	let {position, rotation} = piece;
	let {x,y} = position;

	p = rotate(p, rotation);
	for (var i = 0; i < p.length; i++) {
		for (var c = 0; c < p[i].length; c++) {
			if (p[i][c]) {
				if (!tetris[x+i] || (String(tetris[x+i][y+c]).length > 4 && (String(tetris[x+i][y+c]) !== 'undefined')) || ((x+i) >= tetris.length || (y+c) >= tetris[0].length - _Party.malus) )
					return false
			}
		}
	}
	return true;
}

export const turnPiece = (props, to, p, _dev_mode) => {
	let {piece}		= props;
	let allPieces	= props.allPieces;

	if (!piece || (!piece.position && !p) || !props.game.started) {
		return ;
	}

	if (!piece)
		piece = p;

	if (to === "left" && isLegal(_.map(props.fixedTetris, _.clone), allPieces[piece.model].b, { ...piece, position: { x: piece.position.x - 1, y: piece.position.y } } )){
		piece.position.x--;
	}
	if (to === "right" && isLegal(_.map(props.fixedTetris, _.clone), allPieces[piece.model].b, { ...piece, position: { x: piece.position.x + 1, y: piece.position.y } }))
		piece.position.x++;
	if (to === "down" && isLegal(_.map(props.fixedTetris, _.clone), allPieces[piece.model].b, { ...piece, position: { x: piece.position.x, y: piece.position.y + 1 } }))
		piece.position.y++;
	if (to === "rotate" && isLegal(_.map(props.fixedTetris, _.clone), allPieces[piece.model].b, { ...piece, rotation: (piece.rotation + 1) % 4 }))
		piece.rotation = (piece.rotation + 1) % 4;

	if (to === "fall") {
		let i = 0;

		while (isLegal(_.map(props.fixedTetris, _.clone), allPieces[piece.model].b, { ...piece, position: { x: piece.position.x, y: piece.position.y + i } })) {
			i++;
		}
		if (isLegal(_.map(props.fixedTetris, _.clone), allPieces[piece.model].b, { ...piece, position: { x: piece.position.x, y: piece.position.y + (i-1) } }))
			piece.position.y = piece.position.y + (i-1);
	}

	_Piece.y = piece.position.y;

	if (!_dev_mode)
		props.dispatch(putInMap( _.map(props.fixedTetris, _.clone), allPieces[piece.model].b, piece, allPieces[piece.model].color ));

	if (!isLegal(_.map(props.fixedTetris, _.clone), allPieces[piece.model].b, { ...piece, position: { x: piece.position.x, y: piece.position.y + 1 } })) {
		if (!_Piece.block && to !== 'fall')
			_Piece.block = true;
		else if ((_Piece.block === true && to === "down") || to === "fall")
			setAsFixed(props, _.map(props.fixedTetris, _.clone));
	} else {
		_Piece.block = false;
	}
}

export const rotate = (tetrimino, nb) => {
	const newTetrimino = [];

	tetrimino.map((line, i) => {
		return line.map((bloc, j) => {
				if (!newTetrimino[j]) newTetrimino[j] = []
			return (
				newTetrimino[j][line.length - i - 1] = tetrimino[i][j]
			)
		})
	})

	if (nb > 0)
		return rotate(newTetrimino, nb - 1);
	return newTetrimino
}

export const deleteLine = (tetris, line) => {
	for (var i = tetris[0].length - _Party.malus; i >= 0; i--) {
		if (i <= line && i-1 >= 0) {
			for (var b = 0; b < tetris.length; b++) {
				tetris[b][i] = tetris[b][i-1];
			}
		}
	}
	return _.map(tetris, _.clone);
}

export const verifyTetris = (tetris, nb, props) => {
	let g = 0;

	for (var i = 0; i < tetris[0].length - _Party.malus; i++) {
		if (String(tetris[0][i]).length > 4){
			for (var x = 0; x < tetris.length; x++) {
				if (tetris[x][i] && tetris[x][i].length > 4)
					g++;
			}
			if (g === tetris.length)
				return verifyTetris(deleteLine(_.map(tetris, _.clone), i), nb + 1, props);
			g = 0;
		}
	}
	if (nb) {
		_Party.score = _Party.score + ((nb * 1000) * nb);
		// socket.emit('lineMalus', {lines: nb, score: _Party.score});
		props.dispatch(gameSocket('lineMalus', {lines: nb, score: _Party.score}))
	}
	return tetris;
}

export const requestPiece = (props) => {
	// socket.emit('requestPiece');
	props.dispatch(gameSocket('requestPiece', null))
}

export const sendSpectre = (spectre, props) => {
	props.dispatch(gameSocket('spectreSent', {map: spectre, id: socket.id, player: _Party.login}))
	// socket.emit('spectreSent', {map: spectre, id: socket.id, player: _Party.login});
}

export const startNewGame = (props, bonus) => {
	props.dispatch(gameStart());

	_Party.started = true;
	// socket.emit("runNewGame", {bonus});
	props.dispatch(gameSocket('runNewGame', {bonus}))
	// socket.emit("debugShowPlayers", thisPartyInformation());
	// socket.emit("debugShowGames", thisPartyInformation());
}

export const readyToPlay = (props) => {
	_Party.ready = true;
	startGame(props);
	// socket.emit("debugShowPlayers", thisPartyInformation());
	// socket.emit("debugShowGames", thisPartyInformation());
	// socket.emit("playerReady");
	props.dispatch(gameSocket('playerReady', null))

}

export const thisPartyInformation = () => {
	return { room : _Party.room, login: _Party.login};
}

export const updateInterval = () => {
	if (_Party.interval > 250)
		_Party.interval = _Party.interval - 25;
}

export const gameOver = (props) => {
	initParty(props);
}

export const gameWinner = (props, idRef) => {
	if (idRef === socket.id) {
		alert('Vous avez gagné la partie');
		initParty(props);
	}
}

export const generateMalus = (props, lines) => {
	if (!lines)
		return ;
	props.dispatch(upAllPieces());
	_Party.malus = _Party.malus + lines;
};

export const startGame = (props, e) => {
	// props.dispatch(initTetris());
	gameInfos(props);

	socket.on('pieceSent', (data) => {
		createPiece(props, data[0], props.fixedTetris, props.allPieces);
		_Piece.nextPiece = props.allPieces[data[1]];
		props.dispatch(updateNextPiece(props.allPieces[data[1]]))
	});

	socket.on('gameOver', gameOver.bind(null, props, null));

	socket.on('generateMalus', generateMalus.bind(null, props));

	socket.on('updateInterval', updateInterval);

	socket.on('gameWinner', gameWinner.bind(null, props));

	socket.on('scoreUpdate', (score, player) => {
		props.dispatch(gameScoreApply({player: player, score: score}, _Party.login));
	});
}

export const createPiece = (props, type, fixedTetris, allPieces) => {
	if (props.tetris && props.tetris.length <= 0)
		return ;

	props.dispatch(putInMap(_.map(fixedTetris, _.clone), allPieces[type].b, { model: type, position: { x: 5, y: -2 }, rotation: 1 }, allPieces[type].color ));
}

export const connexionError = (reason) => {
	alert(reason ? reason.ErrorMsg : 'Please clear all window and retry');
}

export const gameInfos = (props) => {
	if (_Party.gameInfos)
		return ;

	props.dispatch(initTetris());

	// socket.emit("firstConnect", thisPartyInformation());
	props.dispatch(gameSocket('firstConnect', thisPartyInformation()))

	socket.on('GameInfos', (iArgs) => {
		let isAdmin = false;
		let gameState = iArgs.gameState;
		let players = iArgs.players;

		for (var i = 0; i < players.length; i++) {
			if (players[i].admin)
				isAdmin = players[i].admin;
			if (players[i].name === _Party.login && players[i].isReady && !players[i].hasLoose && gameState){
				props.dispatch(gameStart());
			}
		}
		props.dispatch(gamePlayers(players, isAdmin, gameState));
	});

	socket.on('chatUpdate', (message, player) => {
		props.dispatch(gameUpdateChat({player: player, message: message}, _Party.login));
	});

	socket.on('spectreUpdated', (data) => {
		props.dispatch(gameSpectreApply(data, _Party.login));
	});

	socket.on('remoteCommand', (data) => {
		if (!data)
			return ;
		props.dispatch(getUpdatedProps((fakeProps) => {

			if (data.move === 'left')
				turnPiece(fakeProps, data.move, fakeProps.piece);
			if (data.move === 'right')
				turnPiece(fakeProps, data.move, fakeProps.piece);
			if (data.move === 'down')
				turnPiece(fakeProps, data.move, fakeProps.piece);
			if (data.move === 'fall')
				turnPiece(fakeProps, data.move, fakeProps.piece);
			if (data.move === 'rotate')
				turnPiece(fakeProps, data.move, fakeProps.piece);

		}));


	})

	socket.on('ConnexionError', connexionError)

	_Party.gameInfos = true;
}

export const initParty = (props) => {
	_Party.restart = true;
	// socket.emit('stopGame');
	props.dispatch(gameSocket('stopGame', null))
	props.dispatch(gameStop());
	socket.removeListener('pieceSent');
	socket.removeListener('playerisOver');
	// socket.removeListener('spectreUpdated');
	socket.removeListener('generateMalus');
	socket.removeListener('updateInterval');
	socket.removeListener('gameWinner');
	socket.removeListener('scoreUpdate');
	clearInterval(_INTERVAL);
	_NOT_SET = false;

	let map = [];

	map = [];
	for (var i = 0; i < 10; i++) {
		map[i] = [];
		for (var b = 0; b < 20; b++) {
			map[i][b] = "case";
		}
	}
	props.dispatch(updateFixedTetris(map))
	props.dispatch(initTetris());
}

export const handleLogin = (e) => { _Party.loginTmp = e.target.value }
export const handleRoom = (e) => { _Party.roomTmp = e.target.value }
export const handleMessage = (e) => { _Party.message = e.target.value }

export const parseUrlAndStore = (props) => {
	let url = window.location.href;
	let login, room;

	if ((url.match(/\[/g) || []).length !== 1 || (url.match(/\]/g) || []).length !== 1) {
		window.location.href = '';
		// window.location.reload();
		return ;
	}

	login = String(url).substring(url.indexOf('[') + 1, url.indexOf(']'))
	room = String(url).substring(url.indexOf('#') + 1, url.indexOf('['))

	if (!login || !room) {
		alert("Une erreur s'est produite");
		window.location.href = '';
		return ;
	}

	if (login.length > 10 || room.length > 10) {
		window.location.href = '';
		// window.location.href = '#' + room.substring(0, 10) + '['+ login.substring(0, 10) +']';
		return ;
	}
	_Party.login = login;
	_Party.room = room;

	gameInfos(props);
}

export const goFunction = (props) => {
	if ((!_Party.loginTmp || !_Party.roomTmp) || (_Party.loginTmp.length > 10 || _Party.roomTmp.length > 10))
		return ;

	if ((_Party.roomTmp.match(/\[/g) || []).length > 0 || (_Party.roomTmp.match(/\]/g) || []).length > 0 ||
		(_Party.loginTmp.match(/\[/g) || []).length > 0 || (_Party.loginTmp.match(/\]/g) || []).length > 0) {
		window.location.href = '';
		alert('Room ou Login invalide.');
		return ;
	}
	_Party.room = _Party.roomTmp;
	_Party.login = _Party.loginTmp;
	gameInfos(props);

	window.location.href = '#' + _Party.room + '['+ _Party.login+']';
	props.dispatch(initTetris());
}

export const sendMessage = (props) => {
	if (!document.getElementById("message").value)
		return ;

	//  socket.emit('sendMessage', {message: _Party.message});
	 props.dispatch(gameSocket('sendMessage', {message: _Party.message}))
	_Party.message = '';
	document.getElementById("message").value = "";
}

export const ifRestart = (n) => {
	if (!n)
		return ;

	_Party = {
		started: false,
		defeat: false,
		interval: 1000,
		malus: 0,
		ready: false,
		room: _Party.room,
		login: _Party.login,
		score: 0,
		gameInfos: true
	}
}

export const checkIfUrlChange = (props, p) => {
	if ((!p.login && !p.room && window.location.hash) || (p.login && p.room && !window.location.hash)) {
		if (!window.location.hash)
			window.location.href = '#' + p.room + '['+ p.login+']';
		parseUrlAndStore(props);
	}
}

export const putIntervalIfNot = (props, p) => {
	if (!_NOT_SET && props.piece && props.piece.position) {
		_INTERVAL = setInterval(()=> {
			props.dispatch(getUpdatedProps((fakeProps) => {
				turnPiece({...fakeProps, piece: props.piece}, 'down', props.piece);
			}));
		}, p.interval);
		_NOT_SET = true;
	}
}

export const myFunc = (keyCode, props) => {
	if (keyCode === 37)
		turnPiece(props, 'left', props.piece);
	if (keyCode === 39)
		turnPiece(props, 'right', props.piece);
	if (keyCode === 32)
		turnPiece(props, 'down', props.piece);
	if (keyCode === 40)
		turnPiece(props, 'fall', props.piece);
	if (keyCode === 38)
		turnPiece(props, 'rotate', props.piece);
}
export const key = (props, o) => {
	document.onkeydown = (e) => {
		let evt = e || window.event;

		if (evt.keyCode === 40 || evt.keyCode === 38 || (evt.keyCode === 32 && e.target.type !== 'text')) {
			e.preventDefault();
		}
		myFunc(evt.keyCode, props);
	}
}

export const mobileController = (p) => {
	if (!p.room)
		return ;
	link = 'http://'+configs.ip+':'+configs.port+'/%23(mobile)' + p.room.substring(0, 10) + '%5B'+ p.login.substring(0, 10) + '%5D';
}

export const leaderboardGet = (props) => {
	if (_Leaderboard)
		return ;

	// socket.emit('leaderBoard');
	props.dispatch(gameSocket('leaderBoard', null));

	socket.on('leaderBoard', (data) => {
		props.dispatch(gameLeaderboard(data));
	});
	_Leaderboard = true;
}

const App = ( props ) => {
	const {tetris} = props;

	key(props);

	leaderboardGet(props);

	putIntervalIfNot(props, _Party);

	ifRestart(_Party.restart);

	mobileController(_Party);

	checkIfUrlChange(props, _Party);

	return (
		<div>
			<Header />
			<Application party={_Party} piece={_Piece} link={link} leaderboard={props.game.leaderboard}/>
		</div>
	);
};

export function mapStateToProps(state) {

	const { movement, game } = state
	const { piece, fixedTetris, tetris, allPieces } = movement

	return {
		fixedTetris,
		tetris,
		piece,
		allPieces,
		game
	}
}

export default connect(mapStateToProps)(App)

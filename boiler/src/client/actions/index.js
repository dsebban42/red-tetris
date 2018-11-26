export const GAME_START = 'GAME_START'
export const GAME_STOP = 'GAME_STOP'
export const GAME_PLAYERS = 'GAME_PLAYERS'
export const GAME_VIEW = 'GAME_VIEW'
export const GAME_CHAT_UPDATE = 'GAME_CHAT_UPDATE'
export const GAME_LEADERBOARD = 'GAME_LEADERBOARD'
export const GAME_GET = 'GAME_GET'
export const GAME_SOCKET = 'GAME_SOCKET'

export function gameSocket(value, data) {
	return {
		type: GAME_SOCKET,
		value,
		data
	}
}

export function gameGET(creds) {
	return {
		type: GAME_GET,
		creds
	}
}

export function gameStart(creds) {
	return {
		type: GAME_START,
		creds
	}
}

export function gameStop(creds) {
	return {
		type: GAME_STOP,
		creds
	}
}

export function gamePlayers(players, isAdmin, gameState) {
	return {
		type: GAME_PLAYERS,
		players,
		isAdmin,
		gameState
	}
}

export function gameSpectreView(view) {
	return {
		type: GAME_VIEW,
		view
	}
}

export function gameSpectreApply(data, login) {
	return (dispatch, getState) => {
		let players	= getState().game.players;
		let isAdmin	= false;

		for (var i = 0; i < players.length; i++) {
			if (players[i].admin)
				isAdmin = players[i].admin;

			if (players[i].name === data.player && data.player !== login) {
				players[i].spectre = data.spectre;
				dispatch(gameSpectreView(i));
				dispatch(gamePlayers(players, isAdmin, getState().game.gameState));
			}
		}
	}
}

export function gameScoreApply(data, login) {
	return (dispatch, getState) => {
		let players	= getState().game.players;
		let isAdmin	= false;

		for (var i = 0; i < players.length; i++) {
			if (players[i].admin)
				isAdmin = players[i].admin;

			if (players[i].name === data.player) {
				players[i].score = data.score;
				dispatch(gamePlayers(players, isAdmin, getState().game.gameState));
			}
		}
	}
}

export function gameUpdateChat(data) {
	return {
		type: GAME_CHAT_UPDATE,
		message: data.message,
		from: data.player,
	}
}

export function gameLeaderboard(data) {
	return {
		type: GAME_LEADERBOARD,
		data
	}
}

export const applyMalus = (tetris) => {
	for (var i = 0; i < tetris.length; i++) {
		for (var b = 0; b < tetris[i].length; b++) {

			tetris[i][b] = tetris[i][b + 1];
			if (!tetris[i][b + 1])
			break ;
		}
	}
	return tetris;
}

export function upAllPieces() {
	return (dispatch, getState) => {
		let fixedTetris	= getState().movement.fixedTetris;
		let tetris		= getState().movement.tetris;

		fixedTetris	= applyMalus(fixedTetris);
		tetris		= applyMalus(tetris);

		dispatch(updateTetris(tetris));
		dispatch(updateFixedTetris(fixedTetris));
	}
}

export function getUpdatedProps(c) {
	return (dispatch, getState) => {
		let movement	= getState().movement;
		let game		= getState().game;

		return c({...movement, game, dispatch});
	}
}

export const INIT_PIECE = 'INIT_PIECE'
export const INIT_TETRIS = 'INIT_TETRIS'

export function initPiece(creds) {
	return {
		type: INIT_PIECE,
		creds
	}
}

export function initTetris(creds) {
	return (dispatch) => {
		let map = [];

		map = [];
		for (var i = 0; i < 10; i++) {
			map[i] = [];
			for (var b = 0; b < 20; b++) {
				map[i][b] = "case";
			}
		}
		dispatch(updateTetris(map))
		dispatch(updateFixedTetris(map))
	}
}

export const UPDATE_NEXT_PIECE = 'UPDATE_NEXT_PIECE';
export const UPDATE_TETRIS = 'UPDATE_TETRIS';
export const UPDATE_FIXED_TETRIS = 'UPDATE_FIXED_TETRIS';

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

export function putInMap(tetris, p, piece, color) {
	return (dispatch, getState) => {

		let {position, rotation} = piece;
		let {x,y} = position, illegal = false;

		p = rotate(p, rotation);
		if (!p)
			return;

		for (var i = 0; i < p.length; i++) {
			for (var c = 0; c < p[i].length; c++) {
				if (p[i][c]) {
					if (tetris[x+i][y+c] && String(tetris[x+i][y+c]).length > 4 && String(tetris[x+i][y+c]) !== 'undefined') {
						illegal = true;
					}
				}
				if (p[i][c])
					tetris[x+i][y+c] =  "case bg-"+color+" active";
			}
		}

		if (!illegal) {
			dispatch(catchUpdateTetris(tetris, piece));
		}
	}
}

export function catchUpdateTetris(tetris, piece) {
	return (dispatch, getState) => {

		let tetrix = getState().movement.fixedTetris;

		for (var m = 0; m < tetris.length; m++) {
			for (var i = 0; i < tetris[m].length; i++) {
				if (tetrix[m][i] && tetrix[m][i].length > 4)
					tetris[m][i] = tetrix[m][i];
			}
		}

		dispatch(updateTetris(tetris, piece));
	}
}

export function updateNextPiece(piece) {
	return {
		type: UPDATE_NEXT_PIECE,
		piece,
	}
}

export function updateTetris(tetris, piece) {
	return {
		type: UPDATE_TETRIS,
		tetris,
		piece
	}
}

export function updateFixedTetris(fixedTetris, piece) {
	return {
		type: UPDATE_FIXED_TETRIS,
		fixedTetris,
		piece
	}
}

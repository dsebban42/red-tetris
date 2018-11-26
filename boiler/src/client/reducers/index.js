import { combineReducers } from 'redux'

import { INIT_PIECE, UPDATE_TETRIS, UPDATE_FIXED_TETRIS, UPDATE_NEXT_PIECE,
	GAME_START, GAME_STOP, GAME_PLAYERS, GAME_VIEW,
	GAME_CHAT_UPDATE, GAME_LEADERBOARD }			from '../actions';

import {pieces} from './listPieces'

function movement(state = {
		allPieces: pieces,
		piece: {},
		tetris: [],
		fixedTetris: [],
		nextpiece: {}
	}, action) {
		switch (action.type) {
			case INIT_PIECE:
				return Object.assign({}, state, {
					piece: action.creds,
				})
			case UPDATE_TETRIS:
				return Object.assign({}, state, {
					tetris: action.tetris,
					piece: action.piece,
				})
			case UPDATE_FIXED_TETRIS:
				return Object.assign({}, state, {
					fixedTetris: action.fixedTetris,
					piece: action.piece,
				})
			case UPDATE_NEXT_PIECE:
				return Object.assign({}, state, {
					nextpiece: action.piece,
				})
			default:
				return state
		}
};

function game(state = {
		started: false,
		players: [],
		viewInt: -1,
		messages: [],
		leaderboard: []
	}, action) {
		switch (action.type) {
			case GAME_START:
				return Object.assign({}, state, {
					started: true,
				})
			case GAME_STOP:
				return Object.assign({}, state, {
					started: false
				})
			case GAME_PLAYERS:
				return Object.assign({}, state, {
					players: action.players,
					isAdmin: action.isAdmin,
					gameState: action.gameState
				})
			case GAME_VIEW:
				return Object.assign({}, state, {
					viewInt: action.view
				})
			case GAME_CHAT_UPDATE:
				return Object.assign({}, state, {
					messages: [{text: action.message, from: action.from}].concat(state.messages)
				})
			case GAME_LEADERBOARD:
				return Object.assign({}, state, {
					leaderboard: action.data
				})
			default:
				return state
		}
};

const myReducers = combineReducers({
	movement,
	game
})

export default myReducers

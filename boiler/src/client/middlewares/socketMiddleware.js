const socketMiddleware = socket => ({ dispatch }) => {
	return next => action => {
		if (action.type === 'GAME_SOCKET') {
			socket.emit(action.value, action.data);
		}
		return next(action)
	}
}

export default socketMiddleware

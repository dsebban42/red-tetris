import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import Mobile	from './containers/Mobile';
import App		from './containers/App';

import thunkMiddleware								from 'redux-thunk'
import { createStore, applyMiddleware, compose }	from 'redux'

import { Provider }				from 'react-redux'
import { composeWithDevTools }	from 'redux-devtools-extension';

import reducers			from "./reducers";
import {Format}			from './containers/Format'
import socketMiddleware from './middlewares/socketMiddleware'

import {configs}	from './params'

import io			from 'socket.io-client'

const socket = io('http://'+configs.ip+':'+configs.port);

global.socket = socket;

const store = createStore(
	reducers,
	composeWithDevTools(applyMiddleware( socketMiddleware(socket), thunkMiddleware )),
	// window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

ReactDOM.render(
	<Provider store={store}>
		<Format />
	</Provider>,
	document.getElementById('root')
);

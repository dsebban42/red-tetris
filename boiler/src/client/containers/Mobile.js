import React	from 'react';
import _		from 'lodash';
import io		from 'socket.io-client'

import {configs} from '../params'

const socket = io('http://'+configs.ip+':'+configs.port);

let _LOGIN
let _ROOM

export const clickLeft = () => { socket.emit('remoteMove', {player: _LOGIN, room: _ROOM, move: 'left'}) }
export const clickRight = () => { socket.emit('remoteMove', {player: _LOGIN, room: _ROOM, move: 'right'}) }
export const clickBottom = () => { socket.emit('remoteMove', {player: _LOGIN, room: _ROOM, move: 'down'}) }
export const clickFall = () => { socket.emit('remoteMove', {player: _LOGIN, room: _ROOM, move: 'fall'}) }
export const clickRotate = () => { socket.emit('remoteMove', {player: _LOGIN, room: _ROOM, move: 'rotate'}) }

export const parseUrl = () => {
	let url = window.location.href;
	let mobile, login, room;

	login = String(url).substring(url.indexOf('[') + 1, url.indexOf(']'))
	room = String(url).substring(url.indexOf(')') + 1, url.indexOf('['))
	mobile = String(url).substring(url.indexOf('(') + 1, url.indexOf(')'))

	if (mobile !== 'mobile')
		return ;

	_LOGIN = login;
	_ROOM = room;
}

const Mobile = ( props ) => {

	parseUrl();

	return (
		<div className="mobile">
			<div className="stuff">
				<div className="button" tabIndex="1" style={{float: 'left'}} onClick={clickLeft}>
					<span className="ion-android-arrow-back"></span>
				</div>
				<div className="button" tabIndex="3" style={{float: 'right'}} onClick={clickRight}>
					<span className="ion-android-arrow-forward"></span>
				</div>
				<div className="button" tabIndex="2" onClick={clickBottom}>
					<span className="ion-android-arrow-down"></span>
				</div>
				<div className="button" tabIndex="4" onClick={clickRotate}>
					<span className="ion-android-refresh"></span>
				</div>
				<div className="button" tabIndex="5" onClick={clickFall}>
					<span className="ion-android-locate"></span>
				</div>
			</div>
		</div>
	);
};

export default Mobile

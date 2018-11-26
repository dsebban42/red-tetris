import React from 'react'
import { connect } from 'react-redux'
import {Col} from './Col'
import {Chatbox} from './chatbox'

import {NextPiece}	from './NextPiece'

import Qrcode		from './qrcode'

import {goFunction, handleLogin, handleRoom, handleMessage, sendMessage, readyToPlay, startNewGame, initParty} from '../containers/App'

const Application = (props) => {
	let _Party = props.party
	let piece = props.piece
	let tetris = props.tetris
	let leaderboard = props.leaderboard

	const {viewInt, messages} = props.game;

	return (
		<div>
		{!_Party.room && <div className="Login" style={{textAlign: 'center'}}>
			LOGIN<br/><hr/>
			<input style={{width: '45%', 'lineHeight': 3, marginTop: '120px'}} type="text" name="login" placeholder="Name" onChange={handleLogin} maxLength="10"/><br/>
			<input style={{width: '45%', 'lineHeight': 3}} type="text" placeholder="Room" name="room" onChange={handleRoom} maxLength="10"/><br/>
			<button type="submit" style={{width: '46%', height: '40px'}} onClick={() => goFunction(props)}>GO</button>
		</div>}
		{!_Party.room && <div className="leaderboard">
			<div className="title">LEADERBOARD</div>
			<ul className="players">
				{props.leaderboard.map((value, key) => {
					return (
						<li key={key}>{key}. {value.name} [{value.score}]</li>
					)
				})}
			</ul>
		</div>}
		{_Party.room &&

		<div id="app" className="App">
			<div className={_Party.defeat ? 'game defeat' : 'game'} style={{marginTop: '20px'}}>
			  {props.tetris.map((value, key) => {
				  return (
					<div key={key} className="col">
						<Col value={value} y={key} malus={_Party.malus}/>
					</div>
				  )
			  })}
			</div>
			<div className="board">
			  <div className="preview">
				  <div className="title"><span>Prochaine Piece</span></div>
				  <NextPiece value={props.nextpiece}/>
			  </div>
			  <hr/>
			  <div className="score">
				  <label className="middle-title">SCORE</label>
				  <div className="value">{_Party.score}</div>
			  </div>
			  <hr/>
			  <div className="informations">
				  <label className="middle-title">Joueurs</label>

				  <hr/>
				  <div className="playerlist">
					  <label className="middle-title">Liste des joueurs</label>
					  {props.game.players && props.game.players.map((value, key) => {
						  return (
							  <div key={key}>
								  {value.hasLoose && value.isReady ? '💀' : ''}
								  {!value.isReady && props.game.gameState ? '👁' : ''}
								  {!value.hasLoose && value.isReady && props.game.gameState ? '😁' : ''}
								  {props.game.isAdmin === value.name ? '🎖' : ''}
								  <span style={{marginLeft:'10px', color: value.isReady ? 'green' : 'red'}}>{value.name} {(value.name !== _Party.login) && (value.score ? '(' + value.score + ')' : '(0)')}</span>
							  </div>
						  )
					  })}

				  </div>
				  <hr/>
				  {!props.game.gameState && props.game.isAdmin === _Party.login && _Party.ready && <div>
					  <button onClick={() => startNewGame(props)}>Commencer le jeu</button>
					  <button onClick={() => startNewGame(props, true)}>Commencer le jeu avec bonus</button>
				  </div>}

				  {props.game.gameState && props.game.isAdmin === _Party.login && <div>
					  <button onClick={() => initParty(props)}>Arret de la partie</button>
				  </div>}

				  {!_Party.ready && !props.game.gameState && <div>
					  <button onClick={() => readyToPlay(props)}>Prêt !</button>
				  </div>}

				  {!_Party.ready && props.game.gameState && <div>
					  Partie en cours...
				  </div>}

				  <div id="chat">
					  <input className="inpt-message" type="text" placeholder="Message" id="message" onChange={handleMessage} maxLength="20"/>
					  <button className="btn-send" type="submit" onClick={sendMessage.bind(null, props)}>Envoyer</button>
					  <div className="box-message">
						  <Chatbox messages={messages} />
					  </div>
					</div>
				</div>
			</div>
				<div>
					<div style={{width: '100%', textAlign: 'center'}}>
						{props.game.started && viewInt !== -1 && props.game.players[viewInt] && props.game.players[viewInt].name}
						{(!props.game.gameState || (props.game.gameState && viewInt === -1)) && "Spectre des joueurs"}
					</div>
					{props.game.players[viewInt] &&  <div className="game">
						{props.game.players[viewInt] && props.game.players[viewInt].spectre && props.game.players[viewInt].spectre.map((spectrePlayer, keySpectre) => {
							return (
							<div key={keySpectre} className="col">
								<Col value={spectrePlayer} y={keySpectre} spectre={true}/>
							</div>
							)
						})}
						</div>
					}
				</div>
			</div>
		}
		{_Party.login && <div style={{textAlign: 'center', color: 'white'}}><Qrcode addr={props.link}/></div>}
	</div>
	);
}

export function mapStateToProps(state) {

	const { movement, game } = state
	const { piece, fixedTetris, tetris, allPieces, nextpiece } = movement

	return {
		fixedTetris,
		tetris,
		piece,
		allPieces,
		game,
		nextpiece,
	}
}

export default connect(mapStateToProps)(Application)

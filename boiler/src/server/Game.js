const _GRADE = 5;

class Game {
	constructor(name)
	{
		this.roomName					 = name;
		this.running					 = false;
		this.admin 						 = {};
		this.registeredPlayers = [];
		this.activesPlayers 	 = [];
		this.piecesManager		 = null;
		this.totalPcsCount		 = 0;
	}

	playerRequestNewPiece(playerID){
		let idReg		 	= this.piecesManager.idReg;
		let nbPlayers = this.activesPlayers.length;
		let byID 			= (elem) => { return elem === playerID };

		if (idReg.findIndex(byID) === -1)
			idReg.push(playerID);
		if (idReg.length === nbPlayers)
		{
			this.piecesManager.idReg = [];
			this.piecesManager.shiftPcsBuff();
			this.activesPlayers.forEach((elem) =>{
				elem.decreasePosInPieceLst();
			});
		}
	}

	manipInterval(io){
		if (this.totalPcsCount && this.totalPcsCount % (_GRADE * this.activesPlayers.length) === 0)
		{
			io.in(this.roomName).emit('updateInterval');
		}
	}

	newPieceToPlayer(io, player){
		if (!this.running)
			return ;

		let posInPieceLst = player.getPosInPieceLst;
		let piecesBuff = this.piecesManager.getPiece;

		if (posInPieceLst >= this.piecesManager.lastIndex - 1)
		{
			this.piecesManager.generate();
			this.totalPcsCount++;
			this.manipInterval(io);
		}
		player.newPiece();
		io.to(player.idSession).emit('pieceSent', piecesBuff.slice(posInPieceLst, posInPieceLst + 2));
		this.playerRequestNewPiece(player.idSession);
	}

	resetProcess(){
		this.running				= false;
		this.piecesManager	= null;
		this.totalPcsCount  = 0;
		this.activesPlayers = [];
		}

	resetPlayers(){
		this.registeredPlayers.forEach( (elem) => {
			elem.reset();
		});
	}

	stopGame(io){
		this.resetProcess();
		io.in(this.roomName).emit('gameOver');
	}

};

module.exports = Game;

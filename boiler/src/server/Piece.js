class Piece {
	constructor()
	{
		this.baseModel 	= ['l', 'z', 'i', 't', 'o', 's', 'j'];
		this.bonusModel 	= ['B1', 'B2', 'B3', 'B4', 'B5'];
		this.fakebaseModel 	= ['i','i','i','i','i','i','i','i',];
		this.piecesBuff = [];
		this.lastIndex	= 1;
		this.idReg			= [];
	}

	bonus(){
		this.baseModel = this.baseModel.concat(this.bonusModel);
	}

	randomise(){
		return this.baseModel[Math.floor((Math.random() * this.baseModel.length) + 0)];
	}

	generate(){
		if (this.piecesBuff.length === 0)
		{
			for (var i = 0; i < 2; i++)
				this.piecesBuff.push(this.randomise());
		}
		else
		{
			this.piecesBuff.push(this.randomise());
			this.lastIndex++;
		}
	}

	shiftPcsBuff(){
		this.piecesBuff.shift();
		this.lastIndex--;
	}

	get getPiece(){
		return this.piecesBuff;
	}

	get getlastIndex(){
		return this.lastIndex;
	}
}

module.exports = Piece;

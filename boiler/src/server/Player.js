class Player {
	constructor(name, idSession)
	{
		this.name      			= name;
		this.isReady				= false;
    this.idSession 			= idSession;
		this.anchoredRoom		= null;
		this.posInPieceLst	= 1;
		this.hasLoose				= false;
	}

	reset(){
		this.posInPieceLst = 1;
		this.hasLoose			 = false;
		this.isReady			 = false;
	}

	newPiece(){
		this.posInPieceLst++;
	}

	decreasePosInPieceLst(){
			this.posInPieceLst--;
	}

	saveScore(PlayerModel, score){
		return new Promise((resolve, reject) =>{
		PlayerModel.find({name : this.name}, (err, res) => {
      if (!res.length)
      {
        let test = new PlayerModel({ name : this.name, lastScore : score});
        test.save( (err, res) => {
					if (err === null)
						resolve(res);
					else
						reject(err)
        });
      }
			else {
				if (res[0].lastScore < score)
				{
					res[0].set({lastScore : score});
					res[0].save( (err, res) => {
						if (err === null)
							resolve(res);
						else
							reject(err);
					});
				}
				else {
						return resolve("score Not Updated");
				}
			}
    });
	});
	}
	get playerName(){
		return this.name;
	}

	get getPosInPieceLst(){
		return this.posInPieceLst;
	}
}

module.exports = Player;

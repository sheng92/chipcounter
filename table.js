function Table(name, owner){
	this.name = name;
	this.owner = owner;
	this.players = [];
  this.cash = [];
	this.private = false;
}

Table.prototype.addPlayer = function(id, cash) {
    this.players.push(id);
    this.cash.push(cash);
};

Table.prototype.removePlayer = function(name) {
  var ind = -1;
  for(var i = 0; i < this.players.length; i++){
    if(this.players[i].name === name){
      ind = i;
      break;
    }
  }
  if (ind > -1){
    this.players.remove(ind);
    this.cash.remove(ind);
  }
};

Table.prototype.getName = function() {
  return this.name;
};

Table.prototype.getOwner = function() {
  return this.owner;
};

Table.prototype.getPlayers = function() {
  return this.players;
};

Table.prototype.getCash = function() {
  return this.cash;
};


module.exports = Table;
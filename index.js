var express = require("express"),
	app = express(),
	port = process.env.PORT || 3700,
	//Table = require('./table.js'),
	tables = {};
	cashs = {};
	jackpots = {};
	players = {};
 
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.get("/", function(req, res){
	res.render("page");
});


app.use(express.static(__dirname + '/public'));
 
var io = require('socket.io').listen(app.listen(port));

io.set('log level', 2);


io.sockets.on('connection', function (socket) {
	console.log('starting');
	socket.emit('message', { message: 'welcome to the chat' });
	io.sockets.emit('giveTable', {usernames:players, cashs:cashs, tables:tables, jackpots:jackpots});
	socket.on('send', function (data) {
		io.sockets.emit('message', data);
	});
	socket.on('tablesend', function (data) {
		io.sockets.emit('tableMessage', data);
	});
	socket.on('makeTable', function (data) {
		io.sockets.emit('message', {message: data.username + ' joined ' + data.message});
		io.sockets.emit('joinedTable', {message: data.message, username: data.username});
		var table = [];
		var cash = [];
		var player = [];
		var jackpot = 0;
		var username = data.username;
		var tablename = data.message;
		if (typeof tables[tablename] !== "undefined"){
			table = tables[tablename];
			cash = cashs[tablename];
			player = players[tablename];
			jackpot = jackpots[tablename];
			//table.push(tablename);
			cash.push(200);
			player.push(username);
		} else {
			table = [tablename];
			cash = [200];
			player = [username];
			jackpot = 0;
		}
		jackpots[tablename] = jackpot;
		tables[tablename] = table;
		cashs[tablename] = cash;
		players[tablename] = player;
		
		io.sockets.emit('giveTable', {usernames:players, cashs:cashs, tables:tables, jackpots:jackpots});
	});
	socket.on('leaveTable', function (data) {
		var j = "";
		for (key in tables){
			for (key2 in players){
				if (players[key2] == data.username){
					j = key;
				}
			}
		}
		if (j != ""){
			delete tables[j];
			delete players[j];
			delete cashs[j];
		} else{
			console.log("error removing player");
		}
		io.sockets.emit('giveTable', {usernames:players, cashs:cashs, tables:tables, jackpots:jackpots});
	});
	socket.on('makeBet', function (data) {
		if (typeof tables[data.loc] != 'undefined'){
			ind = -1;
			for (key in players[data.loc]){
				if (players[data.loc][key] == data.username){
					ind = key;
				}
			}
			if (ind > -1){
				var bet = parseFloat(data.message);
				if (bet > cashs[data.loc][ind]){
					socket.emit('message', { message: 'bet could not be made. Try again.' });
				}
				else{
					cashs[data.loc][ind] = cashs[data.loc][ind] - bet;
					jackpots[data.loc] += bet;
				}
			}
		}
		io.sockets.emit('giveTable', {usernames:players, cashs:cashs, tables:tables, jackpots:jackpots});
		writeToFile();
	});
	socket.on('decideWinner', function(data){
		if (typeof tables[data.loc] != 'undefined'){
			ind = -1;
			for (key in players[data.loc]){
				if (players[data.loc][key] == data.username){
					ind = key;
				}
			}
			if (ind > -1){
				if (jackpots[data.loc] >= data.message){
					jackpots[data.loc] += -1*data.message;
					cashs[data.loc][ind] += data.message;
					io.sockets.emit('tableMessage', {loc: data.loc, message: data.username + " wins the round, earning $" + data.message})
					io.sockets.emit('giveTable', {usernames:players, cashs:cashs, tables:tables, jackpots:jackpots});
				}
			}
		}
	});

});

console.log("Listening on port " + port);

function writeToFile() {
	var fs = require('fs');
	var file = fs.createWriteStream('playerVars.txt');
	file.on('error', function(err) { /* error handling */ });
	for (key in players) { file.write(players[key] + ', ' + cashs[key] + '\n'); };
	file.end;
}
var express = require("express"),
	app = express(),
	port = 3700,
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
		var username = data.username;
		var tablename = data.message;
		if (typeof tables[tablename] !== "undefined"){
			table = tables[tablename];
			cash = cashs[tablename];
			player = players[tablename];
			//table.push(tablename);
			cash.push(200);
			player.push(username);
		} else {
			table = [tablename];
			cash = [200];
			player = [username];
		}
		jackpots[tablename] = 0;
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
		// var j = -1;
		// for (var i = 0; i < tables.length; i++){
		// 	if (tables[i].name == data.message){
		// 		j = i;
		// 	}
		// }
		// if (j > -1){
		// 	tables[j].removePlayer(data.username);
		// 	if (tables[j].players.length < 1){
		// 		tables.remove(j);
		// 	}
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
				if (bet > cashs[data.loc][key]){
					socket.emit('message', { message: 'bet could not be made. Try again.' });
				}
				else{
					cashs[data.loc][key] = cashs[data.loc][key] - bet;
					jackpots[data.loc] += bet;
				}
			}
		}
		io.sockets.emit('giveTable', {usernames:players, cashs:cashs, tables:tables, jackpots:jackpots});
		writeToFile();
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
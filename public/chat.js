window.onload = function() {

    var messages = [];
    var currTable = '';
    var socket = io.connect('http://localhost:3700');
    var field = document.getElementById("field");
    var sendButton = document.getElementById("send");
    var tableButton = document.getElementById("maketable")
    var leaveButton = document.getElementById("leavetable")
    var board = document.getElementById("board");
    var list = document.getElementById("list");
    var tablename = document.getElementById("tablename");
    var name = document.getElementById("name");
    var betButton = document.getElementById("bet");
    var chips = document.getElementById("chips");
    var cashflow = document.getElementById("cashflow");
    var superuser = document.getElementById("superuser");
    var initialcash = document.getElementById("initialcash");
    var setcashButton = document.getElementById("setinitcash");
    var winnername = document.getElementById("winnername");
    var winnings = document.getElementById("winnings");
    var setwinner = document.getElementById("setwinner");
    

    leaveButton.disabled = true;


    socket.on('message', function (data) {
        if(data.message) {
            if (currTable == ''){
                messages.push(data);
                var html = '';
                for(var i=0; i<messages.length; i++) {
                    html += '<b>' + (messages[i].username ? messages[i].username : 'Server') + ': </b>';
                    html += messages[i].message + '<br />';
                }
                board.innerHTML = html;
                $('#board').animate({"scrollTop": $('#board')[0].scrollHeight}, "fast");
            }
        } else {
            console.log("There is a problem:", data);
        }
    });

    socket.on('tableMessage', function(data){
        if (data.loc == currTable){
            messages.push(data);
            var html = '';
            for(var i=0; i<messages.length; i++) {
                html += '<b>' + (messages[i].username ? messages[i].username : 'Server') + ': </b>';
                html += messages[i].message + '<br />';
            }
            board.innerHTML = html;
            $('#board').animate({"scrollTop": $('#board')[0].scrollHeight}, "fast");
        }
    });

    socket.on('joinedTable', function (data){
        if (field.value == data.username){
            currTable = data.message;
        }
    });

    socket.on('giveTable', function (data){
        var html = '';
        var tables = data.tables;
        var players = data.usernames;
        var cashs = data.cashs;
        console.log(currTable);
        if (currTable == ''){
            html += '<p><b>Currently Open Tables</b></p><ul>';
            var i = 0;
            for (var key in tables){
                html += '<li>' + tables[key] + '<ul><li>hosted by: ' + players[key][0] + '</li></ul></li>';
                i++;
            }
            html += '</ul>'
        } else {
            var j = "";
            var i = 0;
            for (var key in tables){
                if (currTable == tables[key]){
                    j = key;
                }
            }
            if (j != ""){
                html += '<p><b>Players in ' + currTable + ':</b></p><ul>';
                var players = tables[j];
                var cash = tables[j];
                for (var key in players){
                    html += '<li>' + players[key] + '<ul><li>$' + cashs[key] + '</li></ul></li>'; 
                }
                html += '</ul>'
            }
        }
        list.innerHTML = html;
    });

    sendButton.onclick = sendMoney = function() {
        if(name.value == "") {
            alert("Please type your name!");
        } else if (IsLettersOnly(name)) {
            var text = field.value;
            if (currTable==''){
                socket.emit('send', { message: text, username: name.value});
            }
            else{
                socket.emit('tablesend', { message: text, username: name.value, loc: currTable})
            }
            field.value = "";
        } else {
            alert ("Please only use letters.");
        }
    };


    tableButton.onclick = makeTable = function() {
        if(name.value == "") {
            alert("Please type your name.");
        } else if (tablename.value == "" && IsLettersOnly(tablename) == false){
            alert("Please type a valid table name (letters only).")
        } else {
            socket.emit('makeTable', { message: tablename.value, username: name.value });
            name.disabled = true;
            tablename.disabled = true;
            cashflow.style.display = 'inline';
            leaveButton.disabled = false;
        }
    }

    leaveButton.onclick = leaveTable = function() {
        
        messages.push({message: name.value + " has left " + currTable});
        socket.emit('leaveTable', {message: tablename.value, username: name.value});
        currTable = '';
        var html = '';
        for(var i=0; i<messages.length; i++) {
            html += '<b>' + (messages[i].username ? messages[i].username : 'Server') + ': </b>';
            html += messages[i].message + '<br />';
        }
        board.innerHTML = html;
        $('#board').animate({"scrollTop": $('#board')[0].scrollHeight}, "fast");
        name.disabled = false;
        tablename.disabled = false;
        leaveButton.disabled = true;
        cashflow.style.display = 'none';
    }

    betButton.onclick = makeBet = function() {

        if (IsNumberOnly(chips)){
            var chipsbet = parseFloat(chips.value);
            socket.emit('send', { message: name.value + ' placed a bet of ' + chipsbet.toString()});
        } else {
            alert("Please type in a valid number.");
        }
        chips.value = "";
        socket.emit('makeBet', {username: name.value, message: chipsbet});
    }


    // $(document).ready(function() {
    //     $("#field").keyup(function(e) {
    //         if(e.keyCode == 13) {
    //             sendMoney();
    //         }
    //     });
    // });

}


function IsNumberOnly(element) {    
    var value = $(element).val();
    var regExp = "^\\d+\\.?\\d?";
    return value.match(regExp); 
}


function IsLettersOnly(element) {
    var value = $(element).val();
    var regExp = "^[a-zA-Z]*$";
    return value.match(regExp); 
}

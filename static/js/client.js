function showPlayers(players) {
    var list = [];
    var playersIDs = Object.keys(players);
    
    var player = null;
    for (var i = 0; i < playersIDs.length; i++) {
        player = players[playersIDs[i]];
        list.push('<li>' + player.name + '</li>');
    }
    
    document.querySelector('#playersList > ul').innerHTML = list;
}

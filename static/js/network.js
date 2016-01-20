(function () {
    socket.on('playersListUpdated', function (players) {
        showPlayers(players);
    });
})();
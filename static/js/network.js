(function () {
    console.log(socket);
    socket.on('playersListUpdated', function (players) {
        console.log(players);
    });
})();
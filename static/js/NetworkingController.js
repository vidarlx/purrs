var NetworkClient = function () {
    function handleEvents() {
        socket.on('playersListUpdated', function (players) {
            GameClient.showPlayers(players);
        });

        socket.on('image_updated', function (image) {
            GameClient.redrawImage(image);
        });

    }

    function newGame(player) {
        var players = {
            p1: socket.id,
            p2: player
        };

        console.log('NetworkClient | Emit new_game event');
        socket.emit('new_game', players);
    }

    function sendImage(image) {
        // console.log('NetworkClient | Emit send_image event');
        socket.emit('send_image', image);
    }

    return {
        handleEvents: handleEvents,
        newGame: newGame,
        sendImage: sendImage
    };
}();

NetworkClient.handleEvents();
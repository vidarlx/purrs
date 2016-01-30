/* global socket, GameClient, NetworkingPlayer  */

var NetworkingController = function () {
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

        console.log('NetworkingController | Emit new_game event');
        socket.emit('new_game', players);
    }

    function sendImage(image) {
        // console.log('NetworkingController | Emit send_image event');
        socket.emit('send_image', image);
    }
    
    function addToDrawingQueue(player) {
        socket.emit('add_to_queue', player);
    }

    return {
        handleEvents: handleEvents,
        newGame: newGame,
        sendImage: sendImage,
        addToDrawingQueue: addToDrawingQueue
    };
}();

NetworkingController.handleEvents();
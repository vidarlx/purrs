/* global socket, GameClient, NetworkingPlayer  */

var NetworkingController = function () {
    function handleEvents() {
        socket.on('playersListUpdated', function (players) {
            GameClient.showPlayers(players);
        });
        
        socket.on('newGame', function (gameHost) {
            GameClient.startNewGame(gameHost);
        });

        socket.on('image_updated', function (image) {
            GameClient.redrawImage(image);
        });
        
        socket.on('new_message', function (message) {
            GameClient.appendMessages(message);
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
    
    function addToDrawingQueue() {
        socket.emit('add_to_queue', socket.id);
    }
    
    function sendAnswer(playerId, answer) {
        socket.emit('new_answer', {
            playerId: playerId,
            answer: answer
        });
    }
    
    function sendNewName(name, playerId) {
        socket.emit('change_name', name, playerId);
    }

    return {
        handleEvents: handleEvents,
        newGame: newGame,
        sendImage: sendImage,
        addToDrawingQueue: addToDrawingQueue,
        sendAnswer: sendAnswer,
        sendNewName: sendNewName
    };
}();

NetworkingController.handleEvents();
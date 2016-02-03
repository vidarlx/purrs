/* global NetworkingController, DrawingController,  */

var currentImage = null;
var timer = null;

var GameClient = function () {
    var showPlayers = function (players) {
        var list = document.querySelector('#playersList > ul');
        // clear all childs before redraw
        list.innerHTML = '';

        var playersIDs = Object.keys(players);

        var player = null;
        for (var i = 0; i < playersIDs.length; i++) {
            player = players[playersIDs[i]];

            var li = document.createElement('li');
            li.innerHTML = player.name;
            li.addEventListener('click', function () {
                newGame(player.name);
            }, false);

            list.appendChild(li);
        }
    };

    var newGame = function (player) {
        NetworkingController.newGame(player);
    };

    // send current canvas state via NetworkingController to the server
    var sendCurrentImage = function () {
        if (DrawingController.drawingModeEnabled()) {
            // console.log('Client | Sending image to the server');
            NetworkingController.sendImage(JSON.stringify(DrawingController.getCurrentImage()));
        }
        clearTimeout(timer);

        timer = setTimeout(function () {
            sendCurrentImage();
        }, 500);
    };

    var redrawImage = function (image) {
        var currentImage = DrawingController.getCurrentImage();

        if (currentImage) {
            //console.log('Client | Redrawing image');
            currentImage.clear();
            currentImage.loadFromJSON(image, currentImage.renderAll.bind(currentImage));
        }
    };

    var enableDrawingMode = function () {
        console.log('Drawing mode enabled');

        DrawingController.enableDrawingMode();

        timer = setTimeout(function () {
            sendCurrentImage();
        }, 2000);
    };

    var addToDrawQueue = function () {
        // add to queue
        NetworkingController.addToDrawingQueue();
    };
    
    var startNewGame = function (gameHost) {
        if (socket.id === gameHost) {
            enableDrawingMode();
        }
    };

    return {
        showPlayers: showPlayers,
        redrawImage: redrawImage,
        enableDrawingMode: enableDrawingMode,
        addToDrawQueue: addToDrawQueue,
        startNewGame: startNewGame
    };
}();

setTimeout(function () {
    DrawingController.initDrawingContext();
}, 1000);




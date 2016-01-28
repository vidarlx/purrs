/* global NetworkClient, DrawingController,  */

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
        NetworkClient.newGame(player);
    };

    // send current canvas state via NetworkingController to the server
    var sendCurrentImage = function () {
        if (DrawingController.drawingModeEnabled()) {
            // console.log('Client | Sending image to the server');
            NetworkClient.sendImage(JSON.stringify(DrawingController.getCurrentImage()));
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
        console.log('drawing mode enabled');

        // lock another users' canvas
        //NetworkingController.lockOthers(player);
        DrawingController.enableDrawingMode();

        timer = setTimeout(function () {
            sendCurrentImage();
        }, 2000);
    };

    return {
        showPlayers: showPlayers,
        redrawImage: redrawImage,
        enableDrawingMode: enableDrawingMode
    };
}();

setTimeout(function () {
    DrawingController.initDrawingContext();
}, 1000);




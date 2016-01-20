var isDrawingPlayer = false;
var currentImage = null;
var timer = null;

var GameClient = function () {
    function showPlayers(players) {
        var list = document.querySelector('#playersList > ul');
        // clear all childs before redraw
        list.innerHTML = '';

        var playersIDs = Object.keys(players);


        if (playersIDs.length == 1) {
            console.log('First player: drawing mode enabled')
            isDrawingPlayer = true;

            timer = setTimeout(function () {
                sendCurrentImage();
            }, 2000);

        }

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
    }

    var newGame = function (player) {
        NetworkClient.newGame(player);
    }

    var sendCurrentImage = function () {
        if (currentImage) {
            console.log('Client | Sending image to the server');
            NetworkClient.sendImage(JSON.stringify(currentImage));
        }
        clearTimeout(timer);

        timer = setTimeout(function () {
            sendCurrentImage();
        }, 500);
    }

    var redrawImage = function (image) {
        if (currentImage) {
            console.log('Client | Redrawing image');
            currentImage.clear();
            currentImage.loadFromJSON(image, currentImage.renderAll.bind(currentImage));
        }
    }

    return {
        showPlayers: showPlayers,
        redrawImage: redrawImage
    }
}();


